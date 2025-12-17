import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

const PermissionEditor = ({ permission, onSave, onCancel }) => {
  const [selected, setSelected] = useState(permission.permissions || []);

  const toggle = (char) => {
    setSelected(prev => 
      prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]
    );
  };

  const handleSave = () => {
    onSave({ ...permission, permissions: selected });
  };

  return (
    <div className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-4 w-64 animate-in fade-in zoom-in-95 duration-200">
      <h3 className="font-bold mb-3 text-sm text-gray-700">Edit Permissions</h3>
      <div className="space-y-2 mb-4">
        {['C', 'R', 'U', 'D'].map(char => {
            const label = { 'C': 'Create', 'R': 'Read', 'U': 'Update', 'D': 'Delete' }[char];
            return (
                <div key={char} className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        id={`perm-${char}`} 
                        checked={selected.includes(char)}
                        onChange={() => toggle(char)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-600"
                    />
                    <label htmlFor={`perm-${char}`} className="text-sm font-medium">{label} ({char})</label>
                </div>
            );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} className="h-8">Cancel</Button>
        <Button size="sm" onClick={handleSave} className="bg-teal-700 hover:bg-teal-800 h-8">Save</Button>
      </div>
    </div>
  );
};

export default function UserRoleSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editPosition, setEditPosition] = useState(null);

  const { data: rawPermissions = [] } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: () => api.entities.RolePermission.list()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.RolePermission.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rolePermissions']);
      setEditingId(null);
      toast.success("Permissions updated");
    },
    onError: () => toast.error("Failed to update")
  });

  // Process data for the table
  const MODULE_ORDER = [
    'LOGIN', 'PERMISSIONS', 'USER', 'USER ROLE', 'DASHBOARD', 'CLIENT', 
    'LEAD', 'PROPOSAL', 'QUOTATION', 'INVOICE', 'PAYMENT', 'PROJECT', 
    'CHAT', 'EMAIL'
  ];

  const processedData = MODULE_ORDER.map(module => {
    const row = { name: module };
    ['admin', 'manager', 'marketing', 'finance'].forEach(role => {
      row[role] = rawPermissions.find(p => p.module === module && p.role === role) || { permissions: [], value_type: 'crud' };
    });
    return row;
  });

  const handleCellClick = (e, permission) => {
    if (permission.value_type !== 'crud') return;
    
    // Calculate position for fixed positioning
    const rect = e.currentTarget.getBoundingClientRect();

    setEditPosition({
        top: rect.bottom + 5,
        left: rect.left - 20 
    });
    setEditingId(permission.id);
  };

  const renderCell = (permission, role) => {
    const { value_type, permissions, text_value, id } = permission;

    if (!id) return <span className="text-gray-300">-</span>;

    const content = () => {
        if (value_type === 'text') return <span className="font-bold text-green-600">{text_value}</span>;
        
        // Handle CRUD display
        if (value_type === 'crud') {
            // Check for "Full Access" or "No Access" scenarios based on array content
            // Assuming seeded data might use permissions array to represent these
            const hasC = permissions.includes('C');
            const hasR = permissions.includes('R');
            const hasU = permissions.includes('U');
            const hasD = permissions.includes('D');
            const isFull = hasC && hasR && hasU && hasD;
            const isEmpty = permissions.length === 0;

            if (isEmpty) return <span className="text-xs px-2 py-1 text-red-500">No Access</span>;
            
            return (
                <div className="flex gap-1 justify-center">
                  {['C', 'R', 'U', 'D'].map(char => (
                    <span key={char} className={`
                      w-6 h-6 flex items-center justify-center border text-xs font-bold rounded
                      ${permissions.includes(char) ? 
                        (char === 'C' ? 'text-green-600 border-green-200 bg-green-50' : 
                         char === 'R' ? 'text-orange-500 border-orange-200 bg-orange-50' : 
                         char === 'U' ? 'text-blue-500 border-blue-200 bg-blue-50' : 'text-red-500 border-red-200 bg-red-50') 
                        : 'text-gray-300 border-gray-100 bg-gray-50'}
                    `}>
                      {char}
                    </span>
                  ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div 
            onClick={(e) => handleCellClick(e, permission)}
            className={`h-full w-full p-2 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors ${value_type === 'crud' ? 'group' : ''}`}
        >
            {content()}
            {value_type === 'crud' && (
               <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 absolute bottom-1 right-1">Edit</span>
            )}
        </div>
    );
  };

  return (
    <div className="space-y-6 pt-10 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-red-700">User Role Management</h2>
        <Button className="bg-teal-800 hover:bg-teal-900 text-white">Add Role</Button>
      </div>

      <div className="border-2 border-gray-400 rounded-sm overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-2 border-gray-400">
              <TableHead className="text-black font-bold border-r-2 border-gray-400 w-48 text-center bg-gray-100 uppercase">User Role Access</TableHead>
              <TableHead className="text-black font-bold border-r-2 border-gray-400 text-center uppercase">Admin</TableHead>
              <TableHead className="text-black font-bold border-r-2 border-gray-400 text-center uppercase">Manager</TableHead>
              <TableHead className="text-black font-bold border-r-2 border-gray-400 text-center uppercase">Marketing</TableHead>
              <TableHead className="text-black font-bold text-center uppercase">Finance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-gray-50 border-b border-gray-300 last:border-0 h-14">
                <TableCell className="font-bold border-r-2 border-gray-400 bg-gray-50/50 uppercase text-xs align-middle">
                    {row.name}
                </TableCell>
                <TableCell className="border-r-2 border-gray-400 text-center p-0 align-middle relative">
                    {renderCell(row.admin, 'admin')}
                </TableCell>
                <TableCell className="border-r-2 border-gray-400 text-center p-0 align-middle relative">
                    {renderCell(row.manager, 'manager')}
                </TableCell>
                <TableCell className="border-r-2 border-gray-400 text-center p-0 align-middle relative">
                    {renderCell(row.marketing, 'marketing')}
                </TableCell>
                <TableCell className="text-center p-0 align-middle relative">
                    {renderCell(row.finance, 'finance')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingId && editPosition && (
         <div style={{ position: 'fixed', top: editPosition.top, left: editPosition.left, zIndex: 50 }}>
            <PermissionEditor 
                permission={rawPermissions.find(p => p.id === editingId)} 
                onSave={(data) => updateMutation.mutate(data)}
                onCancel={() => setEditingId(null)}
            />
         </div>
      )}
    </div>
  );
}