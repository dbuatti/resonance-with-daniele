"use client";

import React from "react";
import SurveyForm from "@/components/profile/SurveyForm";
// No need for Card here, as ProfileLayoutPage will provide the container styling.

const SurveyPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto"> {/* Kept max-w-2xl mx-auto as it's a direct child of ProfileLayoutPage */}
      <SurveyForm />
    </div>
  );
};

export default SurveyPage;