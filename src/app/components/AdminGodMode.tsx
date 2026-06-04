// ADMIN GOD MODE - Full Control dengan Anti-Fraud System
// Semua manual adjustment bersifat TEMPORARY (expire 24 jam)

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Zap, 
  Award, 
  TrendingUp,
  Clock,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Plus,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { getAvailableBadgesForArea } from '@/data/validatedBadges';

interface AdminGodModeProps {
  adminUser: any;
  authToken: string | null;
}

interface TemporaryAdjustment {
  id: string;
  type: 'points' | 'badge' | 'level';
  value: any;
  reason: string;
  grantedAt: string;
  expiresAt: string;
  targetUserName: string;
}

export function AdminGodMode({ adminUser, authToken }: AdminGodModeProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [temporaryAdjustments, setTemporaryAdjustments] = useState<TemporaryAdjustment[]>([]);
  
  // Form states
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [reason, setReason] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchTemporaryAdjustments();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any>('/users', authToken);
      setUsers(data.users || []);
    } catch {
      toast.error('Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemporaryAdjustments = async () => {
    try {
      const data = await apiGet<any>('/admin/temporary-adjustments', authToken);
      setTemporaryAdjustments(data.adjustments || []);
    } catch {
      // Silently ignore — non-critical
    }
  };

  const handleAssignModeratorRole = async (userId: string) => {
    if (!confirm('Assign Moderator role? This gives the user verification powers.')) return;
    
    try {
      await apiPost('/admin/assign-role', { userId, role: 'moderator', reason: 'Assigned by admin' }, authToken);
      toast.success('Moderator role assigned!');
      fetchUsers();
    } catch {
      toast.error('Failed to assign role');
    }
  };

  const handleRemoveModeratorRole = async (userId: string) => {
    if (!confirm('Remove Moderator role? User will lose verification powers.')) return;
    
    try {
      await apiPost('/admin/remove-role', { userId, role: 'moderator' }, authToken);
      toast.success('Moderator role removed!');
      fetchUsers();
    } catch {
      toast.error('Failed to remove role');
    }
  };

  const handleAddTemporaryPoints = async () => {
    if (!selectedUser || !pointsToAdd || !reason) {
      toast.error('Please fill all fields');
      return;
    }
    
    const points = parseInt(pointsToAdd);
    if (isNaN(points) || points <= 0 || points > 500) {
      toast.error('Points must be between 1-500');
      return;
    }
    
    try {
      await apiPost('/admin/add-temporary-points', { userId: selectedUser.id, points, reason }, authToken);
      toast.success(`+${points} points added (expires in 24h)`);
      setPointsToAdd('');
      setReason('');
      fetchUsers();
      fetchTemporaryAdjustments();
    } catch {
      toast.error('Failed to add points');
    }
  };

  const handleAddTemporaryBadge = async () => {
    if (!selectedUser || !selectedBadgeId || !reason) {
      toast.error('Please select badge and provide reason');
      return;
    }
    
    try {
      await apiPost('/admin/add-temporary-badge', { userId: selectedUser.id, badgeId: selectedBadgeId, reason }, authToken);
      toast.success('Badge added (expires in 24h)');
      setSelectedBadgeId('');
      setReason('');
      fetchUsers();
      fetchTemporaryAdjustments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add badge');
    }
  };

  const availableBadges = selectedUser 
    ? getAvailableBadgesForArea(selectedUser.kecamatan, selectedUser.kelurahan, selectedUser.rw)
    : [];

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <Card className="border-2 border-yellow-500 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <div className="font-bold text-yellow-900 mb-1">⚠️ ADMIN GOD MODE - USE RESPONSIBLY</div>
              <div className="text-sm text-yellow-800">
                Semua manual adjustment bersifat <strong>TEMPORARY</strong> dan akan <strong>EXPIRE dalam 24 JAM</strong>. 
                Ini untuk mencegah kecurangan dan abuse of power. Semua aksi tercatat dan dapat di-audit.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Role Management
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            <Zap className="w-4 h-4 mr-2" />
            Temporary Adjustments
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ROLE MANAGEMENT */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Discord-Style Role Management</CardTitle>
              <CardDescription>
                Assign/remove moderator role to users (like Discord roles)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === 'moderator' ? 'bg-blue-100' : 'bg-gray-200'
                      }`}>
                        {user.role === 'moderator' ? (
                          <Shield className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Users className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          {user.kecamatan} • {user.points} poin
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={user.role === 'moderator' ? 'bg-blue-600' : 'bg-gray-500'}>
                        {user.role.toUpperCase()}
                      </Badge>
                      
                      {user.role === 'user' && (
                        <Button
                          size="sm"
                          onClick={() => handleAssignModeratorRole(user.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Make Moderator
                        </Button>
                      )}
                      
                      {user.role === 'moderator' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveModeratorRole(user.id)}
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Remove Role
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPORARY ADJUSTMENTS */}
        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle>Temporary Adjustments (24h Expire)</CardTitle>
              <CardDescription>
                Add points or badges temporarily - Auto-expire setelah 24 jam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Select User</label>
                  <Select onValueChange={(val) => setSelectedUser(users.find(u => u.id === val))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.role} ({user.points} poin)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUser && (
                  <>
                    {/* Add Points */}
                    <Card className="border-2 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Add Temporary Points
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          type="number"
                          placeholder="Points (1-500)"
                          value={pointsToAdd}
                          onChange={(e) => setPointsToAdd(e.target.value)}
                          max={500}
                        />
                        <Input
                          placeholder="Reason (required)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <Button
                          onClick={handleAddTemporaryPoints}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Points (Expires in 24h)
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Add Badge */}
                    <Card className="border-2 border-purple-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Add Temporary Badge
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Select onValueChange={setSelectedBadgeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose badge..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBadges.map(badge => (
                              <SelectItem key={badge.id} value={badge.id}>
                                {badge.icon} {badge.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Reason (required)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <Button
                          onClick={handleAddTemporaryBadge}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Add Badge (Expires in 24h)
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Active Temporary Adjustments</CardTitle>
              <CardDescription>
                Will auto-expire after 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {temporaryAdjustments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active temporary adjustments
                </div>
              ) : (
                <div className="space-y-3">
                  {temporaryAdjustments.map(adj => {
                    const hoursLeft = Math.max(0, Math.round((new Date(adj.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
                    
                    return (
                      <div key={adj.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold">{adj.targetUserName}</div>
                            <div className="text-sm text-gray-600">{adj.reason}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {hoursLeft}h left
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {adj.type === 'points' && `+${adj.value} points`}
                          {adj.type === 'badge' && `Badge: ${adj.value}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}