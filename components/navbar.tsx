"use client";
import React, { useEffect, useState } from "react";
import { DarkModeToggler } from "./dark-mode-toggler";
import Link from "next/link";
import { getAuthenticatedUser, signoutUser } from "@/lib/db/db.actions";

function Navbar() {
  const [user, setUser] = useState<any>(null);

  console.log(user);

  const fetchUser = async () => {
    try {
      const res = await getAuthenticatedUser();

      setUser(res);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signoutUser();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="top-0 sticky z-50 flex justify-between items-center p-5 px-10">
      <Link href={"/"}>
        <h1 className="font-poppins text-sm">pathaka.ai response testing</h1>
      </Link>

      <div className="flex items-center space-x-3">
        <DarkModeToggler />
      </div>
    </div>
  );
}

export default Navbar;
