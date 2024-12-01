import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthContext";
import { z } from "zod";

// Validation schemas
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  role: z.string(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AccountTab() {
  const { toast } = useToast();
  const { user, updateUser, updatePassword } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    phone: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email || "",
        company: user.company || "",
        role: user.role || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSaveChanges = async () => {
    try {
      await userSchema.parse(userData);
      await updateUser(userData);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangePassword = async () => {
    try {
      await passwordSchema.parse(passwordData);
      await updatePassword(passwordData);
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast({
        title: "API Key Copied",
        description: "The API key has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy API key:', error);
      toast({
        title: "Error",
        description: "Failed to copy API key to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateApiKey = async (type: 'public' | 'private') => {
    try {
      // Call your API to regenerate the key
      // const newKey = await regenerateApiKey(type);
      toast({
        title: "API Key Regenerated",
        description: `Your ${type} API key has been regenerated successfully.`,
      });
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate API key.",
        variant: "destructive",
      });
    }
  };

  const handleEnableTwoFactor = () => {
    // Implement two-factor authentication logic here
  };

  const handleInviteUser = () => {
    // Implement invite user logic here
  };

  const handleRemoveUser = (id: number) => {
    // Implement remove user logic here
  };

  return (
    <div className="p-8 space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-teal-400">Account Settings</h2>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                value={isEditing ? userData.name : user?.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                value={isEditing ? userData.email : user?.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="company" className="text-white">Company</Label>
              <Input
                id="company"
                value={isEditing ? userData.company : user?.company}
                onChange={(e) => setUserData({ ...userData, company: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-white">Role</Label>
              <Input
                id="role"
                value={isEditing ? userData.role : user?.role}
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-white">Phone Number</Label>
              <Input
                id="phone"
                value={isEditing ? userData.phone : user?.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setUserData({
                        name: user?.name || "",
                        email: user?.email || "",
                        company: user?.company || "",
                        role: user?.role || "",
                        phone: user?.phone || "",
                      });
                    }}
                    variant="outline"
                    className="bg-gray-700 text-white border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Public API Key</Label>
              <div className="flex space-x-2">
                <Input
                  value={user?.publicApiKey || ""}
                  readOnly
                  className="bg-gray-700 text-white border-gray-600 flex-grow"
                />
                <Button
                  onClick={() => handleCopyApiKey(user?.publicApiKey || "")}
                  variant="outline"
                  className="bg-gray-700 text-white border-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleRegenerateApiKey('public')}
                  variant="outline"
                  className="bg-gray-700 text-white border-gray-600"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-white">Private API Key</Label>
              <div className="flex space-x-2">
                <Input
                  type={showPrivateKey ? "text" : "password"}
                  value={user?.privateApiKey || ""}
                  readOnly
                  className="bg-gray-700 text-white border-gray-600 flex-grow"
                />
                <Button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  variant="outline"
                  className="bg-gray-700 text-white border-gray-600"
                >
                  {showPrivateKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => handleCopyApiKey(user?.privateApiKey || "")}
                  variant="outline"
                  className="bg-gray-700 text-white border-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleRegenerateApiKey('private')}
                  variant="outline"
                  className="bg-gray-700 text-white border-gray-600"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => setShowPasswordDialog(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
              Change Password
            </Button>
            <div className="flex items-center space-x-2">
              <Switch
                id="two-factor"
                checked={false} // Implement two-factor authentication logic here
                onCheckedChange={handleEnableTwoFactor}
              />
              <Label htmlFor="two-factor" className="text-white">Enable Two-Factor Authentication</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleInviteUser} className="bg-teal-600 hover:bg-teal-700 text-white">
              Invite New User
            </Button>
            <div className="space-y-4">
              {/* Implement team members list here */}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-white">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="text-white">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleChangePassword} className="bg-teal-600 hover:bg-teal-700 text-white">
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}