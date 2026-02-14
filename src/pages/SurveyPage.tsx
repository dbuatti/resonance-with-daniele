"use client";

import React from "react";
import SurveyForm from "@/components/profile/SurveyForm";
import BackButton from "@/components/ui/BackButton";

const SurveyPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-6" to="/profile" />
      <SurveyForm />
    </div>
  );
};

export default SurveyPage;