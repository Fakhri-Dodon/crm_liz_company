import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Trash2 } from "lucide-react";
import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function EmailSettings({ config, onUpdate }) {
  const [formData, setFormData] = useState(config || {});

  useEffect(() => {
    if (config) setFormData(config);
  }, [config]);

  const { data: emailLogs = [] } = useQuery({
    queryKey: ['emailLogs'],
    queryFn: () => api.entities.EmailLog.list()
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Save functionality
    try {
        if (formData.id) {
            await api.entities.AppConfig.update(formData.id, formData);
        } else {
            await api.entities.AppConfig.create(formData);
        }
        toast.success("Settings saved");
        if (onUpdate) onUpdate();
    } catch (e) {
        toast.error("Error saving settings");
    }
  };

  return (
    <div className="space-y-12 pt-10 pb-20">
      <div>
        <h2 className="text-xl font-bold text-red-700 mb-6">Email Settings</h2>
        
        <h3 className="font-bold mb-4">General Setting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            <div className="space-y-1">
                <Label htmlFor="systemEmail" className="text-sm">System Email Address*</Label>
                <Input 
                    id="systemEmail" 
                    value={formData.system_email || ''} 
                    onChange={(e) => handleChange('system_email', e.target.value)}
                    className="border-teal-900"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="replyTo" className="text-sm">Reply-To Email (optional)</Label>
                <Input 
                    id="replyTo" 
                    value={formData.reply_to_email || ''} 
                    onChange={(e) => handleChange('reply_to_email', e.target.value)}
                    className="border-teal-900"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="fromName" className="text-sm">Default From Name*</Label>
                <Input 
                    id="fromName" 
                    value={formData.default_from_name || ''} 
                    onChange={(e) => handleChange('default_from_name', e.target.value)}
                    className="border-teal-900"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="delivery" className="text-sm">Email Delivery</Label>
                <div className="border border-teal-900 rounded-md px-3 py-2 text-red-600 font-bold">
                    SMTP
                </div>
            </div>
        </div>

        <h3 className="font-bold mb-4">SMTP Setting</h3>
        <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                    <Label htmlFor="smtpHost" className="text-sm">SMTP Host</Label>
                    <Input 
                        id="smtpHost" 
                        value={formData.smtp_host || ''} 
                        onChange={(e) => handleChange('smtp_host', e.target.value)}
                        className="border-teal-900"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="smtpPort" className="text-sm">SMTP Port</Label>
                    <Input 
                        id="smtpPort" 
                        value={formData.smtp_port || ''} 
                        onChange={(e) => handleChange('smtp_port', e.target.value)}
                        className="border-teal-900"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="smtpUser" className="text-sm">User Name</Label>
                    <Input 
                        id="smtpUser" 
                        value={formData.smtp_user || ''} 
                        onChange={(e) => handleChange('smtp_user', e.target.value)}
                        className="border-teal-900"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="smtpPassword" className="text-sm">Password</Label>
                    <Input 
                        id="smtpPassword" 
                        type="password"
                        value={formData.smtp_password || ''} 
                        onChange={(e) => handleChange('smtp_password', e.target.value)}
                        className="border-teal-900"
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end mb-8">
            <Button className="bg-teal-900 hover:bg-teal-800 text-white px-8">Test Email</Button>
        </div>

        <h3 className="font-bold mb-4">Email Visibility by User</h3>
        <div className="border border-teal-900 rounded-t-lg overflow-hidden mb-10">
          <Table>
            <TableHeader className="bg-teal-900">
              <TableRow className="hover:bg-teal-900 border-none">
                <TableHead className="text-white font-bold w-16 text-center">No</TableHead>
                <TableHead className="text-white font-bold w-48 border-r border-teal-800">Field</TableHead>
                <TableHead className="text-white font-bold w-48 text-center border-r border-teal-800">Value</TableHead>
                <TableHead className="text-white font-bold text-center">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-gray-300">
                <TableCell className="text-center">1</TableCell>
                <TableCell className="font-bold border-r border-gray-300">Draft Visibility</TableCell>
                <TableCell className="text-center border-r border-gray-300">Fixed (System)</TableCell>
                <TableCell className="text-red-700">Only displays draft emails created by the logged-in user.</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-300">
                <TableCell className="text-center">2</TableCell>
                <TableCell className="font-bold border-r border-gray-300">Sent Visibility</TableCell>
                <TableCell className="text-center border-r border-gray-300">Fixed (System)</TableCell>
                <TableCell className="text-red-700">Shows only the emails sent by the logged-in user.</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-300">
                <TableCell className="text-center">3</TableCell>
                <TableCell className="font-bold border-r border-gray-300">Inbox Visibility</TableCell>
                <TableCell className="text-center border-r border-gray-300">Fixed (System)</TableCell>
                <TableCell className="text-red-700">Displays only the received or replied emails related to the logged-in user.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <h3 className="font-bold mb-4">Email Log</h3>
        <div className="border border-teal-900 rounded-t-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-teal-900">
              <TableRow className="hover:bg-teal-900 border-none">
                <TableHead className="text-white font-bold w-32 text-center border-r border-teal-800">Date</TableHead>
                <TableHead className="text-white font-bold w-64 text-center border-r border-teal-800">To</TableHead>
                <TableHead className="text-white font-bold text-center border-r border-teal-800">Subject</TableHead>
                <TableHead className="text-white font-bold w-32 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailLogs.map((log, index) => (
                <TableRow key={index} className="border-b border-gray-300">
                  <TableCell className="text-center border-r border-gray-300 p-4">{log.sent_date}</TableCell>
                  <TableCell className="border-r border-gray-300 p-4">{log.to}</TableCell>
                  <TableCell className="border-r border-gray-300 p-4">{log.subject}</TableCell>
                  <TableCell className="p-4">
                    <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                            <BookOpen className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  );
}