// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CVTMarketplace
 * @dev Decentralized marketplace for buying and selling CVT tokens
 * Supports listing, buying, and can be extended with escrow, fees, or auctions
 */
contract CVTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 amount;
        uint256 price; // Price in stablecoin per CVT token
        bool active;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    IERC20 public cvtToken;
    IERC20 public stablecoin;
    
    uint256 private _listingCounter;
    mapping(uint256 => Listing) public listings;
    
    // Marketplace fee (in basis points, e.g., 250 = 2.5%)
    uint256 public marketplaceFeeBps;
    address public feeRecipient;
    
    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 amount,
        uint256 price
    );
    
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    
    event ListingPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 price
    );
    
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    
    /**
     * @dev Constructor
     * @param _cvt Address of CVT token contract
     * @param _stable Address of stablecoin contract
     * @param initialOwner Address of the contract owner
     */
    constructor(
        address _cvt,
        address _stable,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_cvt != address(0), "Invalid CVT address");
        require(_stable != address(0), "Invalid stablecoin address");
        
        cvtToken = IERC20(_cvt);
        stablecoin = IERC20(_stable);
        feeRecipient = initialOwner; // Set owner as initial fee recipient
        marketplaceFeeBps = 250; // 2.5% default fee
    }
    
    /**
     * @dev Create a listing to sell CVT tokens
     * @param amount Amount of CVT tokens to sell
     * @param price Price per CVT token in stablecoin
     * @param expiresIn Number of seconds until listing expires (0 = no expiration)
     * @return listingId ID of the created listing
     */
    function listCVT(
        uint256 amount,
        uint256 price,
        uint256 expiresIn
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(price > 0, "Price must be greater than 0");
        
        // Transfer CVT tokens from seller to contract
        require(
            cvtToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        _listingCounter++;
        uint256 listingId = _listingCounter;
        
        uint256 expiresAt = expiresIn > 0 ? block.timestamp + expiresIn : 0;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            amount: amount,
            price: price,
            active: true,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        emit ListingCreated(listingId, msg.sender, amount, price);
        
        return listingId;
    }
    
    /**
     * @dev Buy CVT tokens from a listing
     * @param listingId ID of the listing to buy from
     */
    function buyCVT(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing inactive");
        require(listing.expiresAt == 0 || block.timestamp <= listing.expiresAt, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        
        uint256 totalPrice = listing.amount * listing.price;
        uint256 fee = (totalPrice * marketplaceFeeBps) / 10000;
        uint256 sellerAmount = totalPrice - fee;
        
        // Transfer stablecoin from buyer to seller and fee recipient
        require(
            stablecoin.transferFrom(msg.sender, listing.seller, sellerAmount),
            "Payment to seller failed"
        );
        
        if (fee > 0) {
            require(
                stablecoin.transferFrom(msg.sender, feeRecipient, fee),
                "Fee payment failed"
            );
        }
        
        // Transfer CVT tokens from contract to buyer
        require(
            cvtToken.transfer(msg.sender, listing.amount),
            "CVT transfer failed"
        );
        
        // Mark listing as inactive
        listing.active = false;
        
        emit ListingPurchased(
            listingId,
            msg.sender,
            listing.seller,
            listing.amount,
            totalPrice
        );
    }
    
    /**
     * @dev Cancel a listing (only by seller)
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing already inactive");
        require(msg.sender == listing.seller, "Not the seller");
        
        // Return CVT tokens to seller
        require(
            cvtToken.transfer(listing.seller, listing.amount),
            "CVT return failed"
        );
        
        listing.active = false;
        
        emit ListingCancelled(listingId, listing.seller);
    }
    
    /**
     * @dev Get listing details
     * @param listingId ID of the listing
     * @return listing Listing struct
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev Get total number of listings
     * @return count Total number of listings created
     */
    function getTotalListings() external view returns (uint256) {
        return _listingCounter;
    }
    
    /**
     * @dev Update marketplace fee (only owner)
     * @param newFeeBps New fee in basis points
     */
    function setMarketplaceFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = marketplaceFeeBps;
        marketplaceFeeBps = newFeeBps;
        emit MarketplaceFeeUpdated(oldFee, newFeeBps);
    }
    
    /**
     * @dev Update fee recipient (only owner)
     * @param newRecipient Address of the new fee recipient
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid fee recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }
}

