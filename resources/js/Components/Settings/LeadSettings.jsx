import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function LeadSettings() {
  const queryClient = useQueryClient();
  
  const { data: leadStatuses = [] } = useQuery({
    queryKey: ['leadStatuses'],
    queryFn: () => api.entities.LeadStatus.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.LeadStatus.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['leadStatuses']);
      toast.success("Status deleted");
    }
  });

  const getStatusColor = (color) => {
    switch (color) {
      case 'orange': return 'text-orange-500 border-orange-500';
      case 'blue': return 'text-blue-500 border-blue-500';
      case 'green': return 'text-green-500 border-green-500';
      case 'red': return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  return (
    <div className="space-y-8 pt-10">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-red-700">Lead Management</h2>
        <Button className="bg-teal-800 hover:bg-teal-900 text-white">Add Status</Button>
      </div>

      <div>
        <h3 className="font-bold mb-4">Lead Status</h3>
        <div className="border border-teal-900 rounded-t-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-teal-900">
              <TableRow className="hover:bg-teal-900 border-none">
                <TableHead className="text-white font-bold w-16 text-center">ID</TableHead>
                <TableHead className="text-white font-bold w-32 text-center">Status</TableHead>
                <TableHead className="text-white font-bold text-center">Note</TableHead>
                <TableHead className="text-white font-bold w-32 text-center">Color</TableHead>
                <TableHead className="text-white font-bold w-32 text-center">Created By</TableHead>
                <TableHead className="text-white font-bold w-24 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadStatuses.map((status, index) => (
                <TableRow key={status.id} className="border-b border-gray-300">
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className="text-center font-bold text-orange-500">{status.name}</TableCell>
                  <TableCell>{status.note}</TableCell>
                  <TableCell className="text-center">
                    <div className={`px-2 py-1 border rounded bg-white text-xs font-bold inline-block w-24 ${getStatusColor(status.color)}`}>
                      {status.color.charAt(0).toUpperCase() + status.color.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{status.created_by_user}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!status.is_system && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => deleteMutation.mutate(status.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {status.is_system && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Lead Restrictions</h3>
        <div className="border border-teal-900 rounded-t-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-teal-900">
              <TableRow className="hover:bg-teal-900 border-none">
                <TableHead className="text-white font-bold w-48 text-center border-r border-teal-800">Field / Setting</TableHead>
                <TableHead className="text-white font-bold w-32 text-center border-r border-teal-800">Type</TableHead>
                <TableHead className="text-white font-bold w-24 text-center border-r border-teal-800">Default</TableHead>
                <TableHead className="text-white font-bold text-center border-r border-teal-800">Description</TableHead>
                <TableHead className="text-white font-bold w-64 text-center">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-gray-300">
                <TableCell className="border-r border-gray-300">User-Base Visibility</TableCell>
                <TableCell className="text-center border-r border-gray-300">Boolean (ON / OFF)</TableCell>
                <TableCell className="text-center border-r border-gray-300">ON</TableCell>
                <TableCell className="border-r border-gray-300">
                  Restrict users to see only Leads they <span className="font-bold text-red-600">created</span> or are <span className="font-bold text-red-600">assigned to</span>.
                </TableCell>
                <TableCell className="text-xs">
                  <div className="mb-2"><span className="font-bold text-red-600">ON</span> = User sees only their Leads</div>
                  <div><span className="font-bold text-red-600">OFF</span> = User sees all accessible Leads</div>
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-300">
                <TableCell className="border-r border-gray-300">Default Filter by User Login</TableCell>
                <TableCell className="text-center border-r border-gray-300">Boolean (ON / OFF)</TableCell>
                <TableCell className="text-center border-r border-gray-300">ON</TableCell>
                <TableCell className="border-r border-gray-300">
                  Automatically filter Lead table to show only data related to the logged-in user.
                </TableCell>
                <TableCell className="text-xs">
                  If <span className="font-bold text-red-600">OFF</span>, table shows all visible Leads initially; user can still filter manually.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}