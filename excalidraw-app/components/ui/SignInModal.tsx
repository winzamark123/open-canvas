import { X } from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "./button";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingGenerations: number;
  maxFreeGenerations: number;
}

export const SignInModal = ({
  isOpen,
  onClose,
  remainingGenerations,
  maxFreeGenerations,
}: SignInModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] pointer-events-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Free Usage Limit Reached
          </h2>
          
          <p className="text-gray-600 mb-6">
            You've used all {maxFreeGenerations} free image generations. 
            Sign in to continue generating images with unlimited access.
          </p>
          
          <div className="space-y-3">
            <SignInButton mode="modal">
              <Button className="w-full">
                Sign In to Continue
              </Button>
            </SignInButton>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Free users get {maxFreeGenerations} generations. Sign in for unlimited access.
          </p>
        </div>
      </div>
    </div>
  );
};