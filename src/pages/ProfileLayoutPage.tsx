"use client";

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import ProfileNavigation from "@/components/profile/ProfileNavigation";

const ProfileLayoutPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="px-4 py-8 md:py-12 space-y-8"> {/* Removed container mx-auto */}
      <h1 className="text-4xl font-bold text-center font-lora">My Account</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Manage your personal details and survey responses.
      </p>
      <div className="max-w-2xl mx-auto">
        <ProfileNavigation currentPath={location.pathname} />
      </div>
      <Outlet /> {/* This will render ProfileDetails or SurveyPage */}
    </div>
  );
};

export default ProfileLayoutPage;