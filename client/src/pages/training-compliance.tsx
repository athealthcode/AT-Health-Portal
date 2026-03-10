import { useState } from "react";
import { useAuth } from "@/state/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Search, AlertCircle, CheckCircle2, Clock, Download, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Course = {
  id: string;
  name: string;
  category: "Mandatory" | "Role-Specific" | "Optional";
  validityMonths: number;
};

type TrainingRecord = {
  id: string;
  staffName: string;
  role: string;
  records: Record<string, {
    status: "compliant" | "expiring" | "expired" | "not-started";
    completedDate?: string;
    expiryDate?: string;
  }>;
};

const COURSES: Course[] = [
  { id: "c1", name: "Information Governance", category: "Mandatory", validityMonths: 12 },
  { id: "c2", name: "Safeguarding Level 2", category: "Mandatory", validityMonths: 36 },
  { id: "c3", name: "Fire Safety", category: "Mandatory", validityMonths: 12 },
  { id: "c4", name: "Infection Control", category: "Mandatory", validityMonths: 12 },
  { id: "c5", name: "Dispensing Errors", category: "Role-Specific", validityMonths: 12 },
  { id: "c6", name: "NMS Training", category: "Role-Specific", validityMonths: 24 },
];

const MOCK_DATA: TrainingRecord[] = [
  {
    id: "s1",
    staffName: "Sarah Jenkins",
    role: "Pharmacist",
    records: {
      "c1": { status: "compliant", completedDate: "2023-10-15", expiryDate: "2024-10-15" },
      "c2": { status: "compliant", completedDate: "2022-05-20", expiryDate: "2025-05-20" },
      "c3": { status: "expiring", completedDate: "2023-04-10", expiryDate: "2024-04-10" },
      "c4": { status: "compliant", completedDate: "2023-11-05", expiryDate: "2024-11-05" },
      "c5": { status: "compliant", completedDate: "2023-08-22", expiryDate: "2024-08-22" },
      "c6": { status: "expired", completedDate: "2021-02-15", expiryDate: "2023-02-15" },
    }
  },
  {
    id: "s2",
    staffName: "Mike Thompson",
    role: "Dispenser",
    records: {
      "c1": { status: "compliant", completedDate: "2024-01-10", expiryDate: "2025-01-10" },
      "c2": { status: "not-started" },
      "c3": { status: "compliant", completedDate: "2023-09-01", expiryDate: "2024-09-01" },
      "c4": { status: "expiring", completedDate: "2023-05-15", expiryDate: "2024-05-15" },
      "c5": { status: "compliant", completedDate: "2023-12-01", expiryDate: "2024-12-01" },
      "c6": { status: "not-started" },
    }
  },
  {
    id: "s3",
    staffName: "Emma Davis",
    role: "Counter Assistant",
    records: {
      "c1": { status: "expired", completedDate: "2022-11-20", expiryDate: "2023-11-20" },
      "c2": { status: "compliant", completedDate: "2023-07-14", expiryDate: "2026-07-14" },
      "c3": { status: "compliant", completedDate: "2024-02-28", expiryDate: "2025-02-28" },
      "c4": { status: "compliant", completedDate: "2023-10-05", expiryDate: "2024-10-05" },
      "c5": { status: "not-started" },
      "c6": { status: "not-started" },
    }
  }
];

export default function TrainingCompliance() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = MOCK_DATA.filter(staff => {
    const matchesSearch = staff.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || staff.role === roleFilter;
    
    // Status filter logic
    let matchesStatus = true;
    if (statusFilter !== "all") {
      const hasStatus = Object.values(staff.records).some(r => r.status === statusFilter);
      matchesStatus = hasStatus;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "compliant": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "expiring": return <Clock className="h-4 w-4 text-amber-500" />;
      case "expired": return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground/40" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "compliant": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
      case "expiring": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "expired": return "bg-rose-500/10 text-rose-700 border-rose-500/20";
      default: return "bg-muted text-muted-foreground border-transparent";
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Training & Compliance
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor staff training records and mandatory course compliance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Matrix
          </Button>
          {session.role !== "Pharmacy Login" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Training
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Training</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Staff Member</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                      <SelectContent>
                        {MOCK_DATA.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.staffName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select course..." /></SelectTrigger>
                      <SelectContent>
                        {COURSES.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <DialogFooter>
                  <Button>Assign Training</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search staff..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Pharmacist">Pharmacist</SelectItem>
            <SelectItem value="Dispenser">Dispenser</SelectItem>
            <SelectItem value="Counter Assistant">Counter Assistant</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="expired">Has Expired</SelectItem>
            <SelectItem value="expiring">Has Expiring Soon</SelectItem>
            <SelectItem value="compliant">Fully Compliant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-emerald-600 mb-1">82%</div>
          <div className="text-sm font-medium text-muted-foreground">Overall Compliance</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center border-rose-500/30 bg-rose-50/50">
          <div className="text-3xl font-bold text-rose-600 mb-1">3</div>
          <div className="text-sm font-medium text-rose-800">Expired Records</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center border-amber-500/30 bg-amber-50/50">
          <div className="text-3xl font-bold text-amber-600 mb-1">5</div>
          <div className="text-sm font-medium text-amber-800">Expiring in 30 Days</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-primary mb-1">2</div>
          <div className="text-sm font-medium text-muted-foreground">Pending Assignments</div>
        </Card>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px] sticky left-0 bg-muted/95 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0]">Staff Member</TableHead>
                {COURSES.map(course => (
                  <TableHead key={course.id} className="min-w-[140px] text-center">
                    <div className="font-medium text-xs whitespace-nowrap">{course.name}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{course.validityMonths}m validity</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map(staff => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium sticky left-0 bg-background/95 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0]">
                    <div className="text-sm">{staff.staffName}</div>
                    <div className="text-[10px] text-muted-foreground">{staff.role}</div>
                  </TableCell>
                  {COURSES.map(course => {
                    const record = staff.records[course.id] || { status: "not-started" };
                    return (
                      <TableCell key={`${staff.id}-${course.id}`} className="text-center p-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className={`w-full py-2 px-1 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-colors hover:opacity-80 ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              <span className="text-[9px] uppercase tracking-wider font-semibold">
                                {record.status === 'not-started' ? 'Pending' : record.status}
                              </span>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Training Record Details</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                  <div className="text-sm text-muted-foreground">Staff Member</div>
                                  <div className="font-medium">{staff.staffName}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">Course</div>
                                  <div className="font-medium">{course.name}</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Current Status</div>
                                  <Badge className={getStatusColor(record.status)} variant="outline">
                                    {record.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Validity</div>
                                  <div className="text-sm font-medium">{course.validityMonths} Months</div>
                                </div>
                              </div>

                              {record.status !== 'not-started' && (
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border">
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Completed On</div>
                                    <div className="text-sm font-medium">{record.completedDate}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Valid Until</div>
                                    <div className="text-sm font-medium">{record.expiryDate}</div>
                                  </div>
                                </div>
                              )}

                              {record.status === 'not-started' && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
                                  This training has not been started yet.
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              {session.role !== "Pharmacy Login" && (
                                <Button className="w-full">Update Record</Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
