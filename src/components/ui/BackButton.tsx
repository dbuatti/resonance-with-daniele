"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  to?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className, to }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft className="mr-2 h-4 w-4" /> Back
    </Button>
  );
};

export default BackButton;