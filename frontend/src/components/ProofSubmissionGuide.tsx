import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  Upload,
  Info,
  AlertCircle,
  Zap,
  Shield,
  Award,
  BookOpen,
  Code,
  Terminal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubmitProof } from "@/hooks/useValidators";
import { useAccount } from "wagmi";

export function ProofSubmissionGuide() {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { submitProof, isPending } = useSubmitProof();
  
  const [validatorAddress, setValidatorAddress] = useState("");
  const [proofCount, setProofCount] = useState("1");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = async () => {
    if (!validatorAddress) {
      toast({
        title: "Error",
        description: "Please enter a validator address",
        variant: "destructive",
      });
      return;
    }

    try {
      const count = parseInt(proofCount);
      
      // Submit proofs one by one (in production, use batchSubmitProof)
      for (let i = 0; i < count; i++) {
        await submitProof(validatorAddress);
      }

      toast({
        title: "Success!",
        description: `${count} proof(s) submitted for validator`,
      });
      
      setDialogOpen(false);
      setValidatorAddress("");
      setProofCount("1");
    } catch (error) {
      console.error("Error submitting proof:", error);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Proof Submission Guide
            </CardTitle>
            <CardDescription>
              Learn how to submit validator proofs and earn rewards
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Submit Proof
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Validator Proof</DialogTitle>
                <DialogDescription>
                  Submit proof verification for a validator to reward them with CVT
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="validator">Validator Address</Label>
                  <Input
                    id="validator"
                    placeholder="0x..."
                    value={validatorAddress}
                    onChange={(e) => setValidatorAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The validator who verified the proof
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">Number of Proofs</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={proofCount}
                    onChange={(e) => setProofCount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each proof earns the validator 1 CVT
                  </p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                  <p className="text-sm font-medium">Estimated Reward</p>
                  <p className="text-2xl font-bold text-primary">
                    {parseInt(proofCount) || 0} CVT
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ≈ ${((parseInt(proofCount) || 0) * 0.5).toFixed(2)} USD
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !validatorAddress}
                >
                  {isPending ? "Submitting..." : "Submit Proof"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="howto">How To</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">What is Proof Submission?</h3>
              <p className="text-sm text-muted-foreground">
                Validators verify zero-knowledge (ZK) proofs for carbon offset claims. 
                When a proof is verified, the validator earns CVT rewards. Only authorized 
                addresses (contract owner or authorized submitters) can submit proofs on-chain.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure Verification</p>
                  <p className="text-xs text-muted-foreground">
                    All proofs are verified using zero-knowledge cryptography
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Award className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Earn Rewards</p>
                  <p className="text-xs text-muted-foreground">
                    1 CVT per proof verified (≈ $0.50 USD)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Instant Credit</p>
                  <p className="text-xs text-muted-foreground">
                    Rewards are credited immediately and claimable anytime
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Authorization Required</p>
                  <p className="text-xs text-muted-foreground">
                    Only the contract owner or authorized submitters can submit proofs. 
                    Regular validators cannot submit proofs for themselves.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="howto" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">How to Submit Proofs</h3>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="method1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Easiest</Badge>
                      <span>Method 1: Frontend Interface</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Click the "Submit Proof" button above</li>
                      <li>Enter the validator's address</li>
                      <li>Enter the number of proofs to submit</li>
                      <li>Click "Submit Proof" and confirm in MetaMask</li>
                      <li>Wait for transaction confirmation</li>
                    </ol>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> You must be the contract owner or an authorized 
                        submitter to use this method.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="method2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Recommended</Badge>
                      <span>Method 2: Management Script</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Use the command-line script for batch submissions:
                    </p>
                    <div className="bg-black/90 text-green-400 p-3 rounded-lg font-mono text-xs space-y-2">
                      <div># Submit 10 proofs for yourself</div>
                      <div>ACTION=submit PROOFS=10 \</div>
                      <div className="pl-4">npx hardhat run scripts/manage-validators.js \</div>
                      <div className="pl-4">--network mantleSepolia</div>
                      <div className="mt-3"># Submit for another validator</div>
                      <div>ACTION=submit VALIDATOR=0xAddress PROOFS=5 \</div>
                      <div className="pl-4">npx hardhat run scripts/manage-validators.js \</div>
                      <div className="pl-4">--network mantleSepolia</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="method3">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Advanced</Badge>
                      <span>Method 3: Batch Submission</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Submit proofs for multiple validators at once:
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs font-medium">1. Create validators.json:</p>
                      <div className="bg-black/90 text-blue-300 p-3 rounded-lg font-mono text-xs">
                        <div>{'[{'}</div>
                        <div className="pl-4">"address": "0xValidator1",</div>
                        <div className="pl-4">"proofs": 10</div>
                        <div>{'},{'}</div>
                        <div className="pl-4">"address": "0xValidator2",</div>
                        <div className="pl-4">"proofs": 5</div>
                        <div>{'}]'}</div>
                      </div>
                      <p className="text-xs font-medium">2. Run batch command:</p>
                      <div className="bg-black/90 text-green-400 p-3 rounded-lg font-mono text-xs">
                        <div>ACTION=batch FILE=validators.json \</div>
                        <div className="pl-4">npx hardhat run scripts/manage-validators.js \</div>
                        <div className="pl-4">--network mantleSepolia</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Reward Structure</h3>
              
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Per Proof Reward</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">1 CVT</span>
                        <span className="text-sm text-muted-foreground">per proof</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ≈ $0.50 USD at current price
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Earning Examples:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">10 proofs</span>
                      <span className="font-medium">10 CVT ($5.00)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">50 proofs</span>
                      <span className="font-medium">50 CVT ($25.00)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">100 proofs</span>
                      <span className="font-medium">100 CVT ($50.00)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Monthly Potential</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Casual (1 proof/day):</span>
                      <span className="font-medium">~30 CVT/month ($15)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active (3 proofs/day):</span>
                      <span className="font-medium">~90 CVT/month ($45)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional (10 proofs/day):</span>
                      <span className="font-medium">~300 CVT/month ($150)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1">
                  <AccordionTrigger>Who can submit proofs?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Only the contract owner or authorized submitter contracts (like CVTMinting) 
                      can submit proofs. Regular validators cannot submit proofs for themselves 
                      to prevent abuse.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q2">
                  <AccordionTrigger>How do validators claim rewards?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Validators can claim their accumulated rewards anytime by clicking the 
                      "Claim Rewards" button on the Validators page or by running the claim 
                      script. There's no expiration on rewards.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q3">
                  <AccordionTrigger>What if the contract runs out of CVT?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      The contract owner needs to fund the ValidatorRewards contract with CVT 
                      tokens. If the balance is low, validators may not be able to claim until 
                      the contract is refunded. Use the management script to fund the contract.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q4">
                  <AccordionTrigger>Can I submit multiple proofs at once?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Yes! Use the batchSubmitProof function or the management script's batch 
                      mode to submit multiple proofs in a single transaction. This saves gas 
                      fees and is more efficient.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q5">
                  <AccordionTrigger>How are proofs verified?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Proofs are verified using zero-knowledge cryptography (ZK-SNARKs). 
                      Validators verify that carbon offset claims are legitimate without 
                      revealing sensitive data. Each verified proof earns the validator a reward.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q6">
                  <AccordionTrigger>What's the gas cost for submitting proofs?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Gas costs vary by network conditions:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Single proof: ~50,000 gas (~0.0005 MNT)</li>
                        <li>Batch (10 proofs): ~200,000 gas (~0.002 MNT)</li>
                        <li>Batch submissions are 4x more efficient!</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4" />
              <span>Need more help? Check the documentation</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/your-repo/carbon-vault/blob/main/PROOF_SUBMISSION_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Code className="h-4 w-4 mr-2" />
                View Full Guide
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

