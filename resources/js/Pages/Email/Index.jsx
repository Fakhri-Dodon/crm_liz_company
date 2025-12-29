import React from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import DevelopmentPage from "../DevelopmentPage";

export default function EmailIndex() {
    const dev = true
    if (dev) {
        return <HeaderLayout><DevelopmentPage /></HeaderLayout>;
    }
    return (
       <div>

       </div>
    );
}
