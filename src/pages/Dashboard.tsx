import { useState, useEffect } from 'react';
import { Plus, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { GroupCard } from '../components/Groups/GroupCard';
import { GroupDetails } from '../components/Groups/GroupDetails';
import { CreateGroupModal } from '../components/Groups/CreateGroupModal';

interface Group {
  id: string;
  name: string;
  description: string;
  total_pooled: number;
  status: 'active' | 'closed';
  created_at: string;
  memberCount?: number;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);

      if (memberError) throw memberError;

      const groupIds = memberData?.map((m) => m.group_id) || [];

      if (groupIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            memberCount: count || 0,
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedGroupId) {
    return (
      <GroupDetails
        groupId={selectedGroupId}
        onBack={() => {
          setSelectedGroupId(null);
          loadGroups();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
              <p className="text-gray-600">
                {user?.user_metadata?.display_name || user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Groups</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading groups...</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first group to start pooling funds with friends
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => setSelectedGroupId(group.id)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={() => {
            setShowCreateModal(false);
            loadGroups();
          }}
        />
      )}
    </div>
  );
}
