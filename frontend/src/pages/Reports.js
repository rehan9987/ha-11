import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Reports = () => {
  const [generating, setGenerating] = useState(false);

  const generateWeeklyReport = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/reports/generate`);
      
      if (response.data.success) {
        // Decode base64 and download
        const base64 = response.data.content;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Weekly report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Weekly Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-xl border border-teal-200">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <FileSpreadsheet className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Comprehensive Library Report</h3>
                <p className="text-slate-600 mb-4">Generate a detailed Excel report with multiple sheets containing:</p>
                <ul className="space-y-2 text-sm text-slate-600 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                    Top Borrowers - Ranked by loan count and total fines
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                    Overdue List - All currently overdue books with fine calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                    Fine Summary - Total fines by department and genre
                  </li>
                </ul>
                <Button 
                  onClick={generateWeeklyReport} 
                  disabled={generating}
                  className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg"
                  data-testid="generate-report-btn"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Weekly Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-800">Report Format</h4>
                </div>
                <p className="text-sm text-slate-600">Multi-sheet Excel workbook (.xlsx) with formatted tables and summaries</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-800">Data Included</h4>
                </div>
                <p className="text-sm text-slate-600">All transactions, user details, book info, and calculated fines</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-800">Update Frequency</h4>
                </div>
                <p className="text-sm text-slate-600">Generate on-demand with real-time data from the system</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-2">Report Information</h4>
            <p className="text-sm text-amber-800">The report includes all historical transaction data with calculated fines based on the tiered policy (5-day grace period, then ₹2/day for days 1-7, ₹5/day for days 8-14, and ₹10/day for 15+ days).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;