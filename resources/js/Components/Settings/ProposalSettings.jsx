import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { FileText } from "lucide-react";

export default function ProposalSettings({ config }) {
  const queryClient = useQueryClient();
  
  const { data: proposalStatuses = [] } = useQuery({
    queryKey: ['proposalStatuses'],
    queryFn: () => api.entities.ProposalStatus.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.ProposalStatus.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposalStatuses']);
      toast.success("Status deleted");
    }
  });

  const getStatusColor = (color) => {
    switch (color) {
      case 'orange': return 'text-orange-500 border-orange-500';
      case 'blue': return 'text-blue-500 border-blue-500';
      case 'green': return 'text-green-500 border-green-500';
      case 'red': return 'text-red-500 border-red-500';
      case 'draft': return 'text-gray-500 border-gray-400';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const templates = [
    { name: 'Modern', color: 'bg-teal-800' },
    { name: 'Professional', color: 'bg-cyan-400' },
    { name: 'Professional', color: 'bg-cyan-400' }, 
    { name: 'Creative', color: 'bg-red-700' },
  ];

  return (
    <div className="space-y-12 pt-10">
      <div>
        <h2 className="text-xl font-bold text-red-700 mb-6">Proposal Settings</h2>
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Proposal Numbering Setting</h3>
          <Button className="bg-teal-800 hover:bg-teal-900 text-white px-8">Edit</Button>
        </div>

        <div className="border border-teal-900 rounded-t-lg overflow-hidden mb-4">
          <Table>
            <TableHeader className="bg-teal-900">
              <TableRow className="hover:bg-teal-900 border-none">
                <TableHead className="text-white font-bold w-16 text-center">No</TableHead>
                <TableHead className="text-white font-bold w-32 text-center">Field</TableHead>
                <TableHead className="text-white font-bold w-32 text-center">Value</TableHead>
                <TableHead className="text-white font-bold text-center">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-gray-300">
                <TableCell className="text-center">1</TableCell>
                <TableCell className="text-center font-bold">Prefix</TableCell>
                <TableCell className="text-center font-bold">{config?.proposal_prefix || 'PRO-'}</TableCell>
                <TableCell>Fixed text added at the beginning of the proposal number.</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-300">
                <TableCell className="text-center">2</TableCell>
                <TableCell className="text-center font-bold">Padding</TableCell>
                <TableCell className="text-center font-bold">{config?.proposal_padding || 5}</TableCell>
                <TableCell>Sets the length of the numeric part. Extra zeros are added to maintain consistent length</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-300">
                <TableCell className="text-center">3</TableCell>
                <TableCell className="text-center font-bold">Next Number</TableCell>
                <TableCell className="text-center font-bold">{config?.proposal_next_number || 1}</TableCell>
                <TableCell>Fixed text added at the beginning of the proposal number.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <p className="text-sm mb-8">
          <span className="font-bold text-red-600">Example : </span> 
          PRO-00001 (Padding 5), PRO-0001 (Padding 4)<br/>
          Display proposal number when saving proposal, for example "PRO-00001"
        </p>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Proposal Status</h3>
          <Button className="bg-teal-800 hover:bg-teal-900 text-white">Add Status</Button>
        </div>

        <div className="border border-teal-900 rounded-t-lg overflow-hidden mb-10">
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
              {proposalStatuses.map((status, index) => (
                <TableRow key={status.id} className="border-b border-gray-300">
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className={`text-center font-bold ${getStatusColor(status.color).split(' ')[0]}`}>{status.name}</TableCell>
                  <TableCell>{status.note}</TableCell>
                  <TableCell className="text-center">
                    <div className={`px-4 py-1 border rounded bg-white text-xs font-bold inline-block w-24 ${getStatusColor(status.color)}`}>
                      {status.color.charAt(0).toUpperCase() + status.color.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell className={`text-center font-bold ${status.is_system ? 'text-gray-600' : 'text-black'}`}>{status.created_by_user}</TableCell>
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

        <h3 className="font-bold mb-4">Proposal Restrictions</h3>
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
                  Restrict users to see only <span className="font-bold text-red-600">Proposals</span> they created or related to their <span className="font-bold text-red-600">Leads</span>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="mb-2"><span className="font-bold text-red-600">ON</span> = only own Proposals</div>
                  <div><span className="font-bold text-red-600">OFF</span> = all visible Proposals.</div>
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-300">
                <TableCell className="border-r border-gray-300">Default Filter by User Login</TableCell>
                <TableCell className="text-center border-r border-gray-300">Boolean (ON / OFF)</TableCell>
                <TableCell className="text-center border-r border-gray-300">ON</TableCell>
                <TableCell className="border-r border-gray-300">
                  Automatically filter Proposal table to show only data related to the logged-in user.
                </TableCell>
                <TableCell className="text-xs">
                  If <span className="font-bold text-red-600">OFF</span>, table shows all visible Proposals initially; user can still filter manually.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="pt-8">
        <h2 className="text-xl font-bold text-red-700 mb-6">Templates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {templates.map((template, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="border border-gray-400 aspect-square flex flex-col">
                 <div className={`h-2/3 w-full ${template.color}`}></div>
                 <div className="h-1/3 w-full bg-white"></div>
              </div>
              <p className="mt-2 text-sm">{template.name}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Button className="bg-teal-800 hover:bg-teal-900 text-white">Add Template</Button>
          <div className="w-8 h-8 border-2 border-teal-800 rounded flex items-end justify-end p-0.5">
             <div className="w-3 h-3 border border-teal-800 bg-teal-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
}