"use client";

import { useState } from "react";
import { Shield, Users, UserPlus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "USER";
  status: "ACTIVE" | "SUSPENDED";
  lastLogin: Date;
};

const MOCK_USERS: AdminUser[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    lastLogin: new Date(),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "MANAGER",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 86400000),
  },
  {
    id: "3",
    name: "Bob Jones",
    email: "bob@example.com",
    role: "USER",
    status: "SUSPENDED",
    lastLogin: new Date(Date.now() - 864000000),
  }
];

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this user?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("User removed");
    }
  };

  const handleSuspend = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" } : u));
    toast.success("User status updated");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-500" />
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage users, roles, and system settings.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
          <UserPlus className="-ml-1 mr-2 h-5 w-5" />
          Invite User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-500">
              {users.filter(u => u.status === "ACTIVE").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl text-indigo-600 dark:text-indigo-500">
              {users.filter(u => u.role === "ADMIN").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Management
          </CardTitle>
          <CardDescription>View and manage all users in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                            {user.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLogin.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                          <MoreVertical className="w-5 h-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast("Edit user not implemented")} className="cursor-pointer">
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSuspend(user.id)} className="cursor-pointer">
                            <Shield className="w-4 h-4 mr-2" /> {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(user.id)} className="cursor-pointer text-red-600 focus:text-red-700">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
