'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verification Documents</h1>
        <p className="text-gray-600 mt-2">Upload documents to verify your gym</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>Please upload all documents for faster verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Drag and drop files here or click to browse</p>
            <Button variant="outline">Choose Files</Button>
          </div>

          <div className="space-y-3 mt-6">
            <h4 className="font-semibold text-gray-900">Document Types:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Business Registration Certificate</li>
              <li>✓ Gym Interior/Exterior Photos (3-5)</li>
              <li>✓ Fitness License or Certification</li>
              <li>✓ Owner ID (Passport or Driver's License)</li>
              <li>✓ Utility Bill (for address verification)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">No documents uploaded yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
