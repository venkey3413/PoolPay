/*
  # Group Expense Pooling Application Schema

  ## Overview
  This migration creates a complete schema for a group expense pooling application
  similar to Splitwise, with UPI payment integration for collecting funds from members.

  ## New Tables

  ### 1. `groups`
  Stores group information for pooling funds
  - `id` (uuid, primary key)
  - `name` (text) - Group name
  - `description` (text) - Group description
  - `created_by` (uuid) - References auth.users
  - `total_pooled` (numeric) - Total amount pooled in the group
  - `status` (text) - active, closed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `group_members`
  Tracks members in each group with their UPI IDs
  - `id` (uuid, primary key)
  - `group_id` (uuid) - References groups
  - `user_id` (uuid) - References auth.users
  - `upi_id` (text) - Member's UPI ID
  - `display_name` (text) - Member's display name
  - `role` (text) - admin, member
  - `joined_at` (timestamptz)

  ### 3. `payment_requests`
  Tracks payment requests sent to group members
  - `id` (uuid, primary key)
  - `group_id` (uuid) - References groups
  - `member_id` (uuid) - References group_members
  - `amount` (numeric) - Requested amount
  - `status` (text) - pending, accepted, rejected, expired
  - `requested_at` (timestamptz)
  - `responded_at` (timestamptz)

  ### 4. `transactions`
  Records all fund movements
  - `id` (uuid, primary key)
  - `group_id` (uuid) - References groups
  - `member_id` (uuid) - References group_members
  - `type` (text) - pool_in, payment_out, refund
  - `amount` (numeric)
  - `description` (text)
  - `merchant_name` (text) - For payment_out transactions
  - `transaction_ref` (text) - External transaction reference
  - `created_at` (timestamptz)

  ### 5. `group_expenses`
  Tracks expenses paid from the pooled funds
  - `id` (uuid, primary key)
  - `group_id` (uuid) - References groups
  - `paid_by` (uuid) - References auth.users
  - `amount` (numeric)
  - `category` (text) - flight, hotel, food, transport, other
  - `description` (text)
  - `merchant_name` (text)
  - `receipt_url` (text)
  - `transaction_id` (uuid) - References transactions
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only view and manage groups they are members of
  - Only group admins can create payment requests
  - Members can only respond to their own payment requests
  - All users must be authenticated to access data

  ## Notes
  - UPI IDs are stored as text and validated at application level
  - Payment request expiry should be handled at application level
  - Webhook integration for actual UPI payments should be implemented separately
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  total_pooled numeric DEFAULT 0 CHECK (total_pooled >= 0),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  upi_id text NOT NULL,
  display_name text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES group_members(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  requested_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES group_members(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('pool_in', 'payment_out', 'refund')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  merchant_name text,
  transaction_ref text,
  created_at timestamptz DEFAULT now()
);

-- Create group_expenses table
CREATE TABLE IF NOT EXISTS group_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  paid_by uuid REFERENCES auth.users(id) NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  category text DEFAULT 'other' CHECK (category IN ('flight', 'hotel', 'food', 'transport', 'other')),
  description text NOT NULL,
  merchant_name text,
  receipt_url text,
  transaction_id uuid REFERENCES transactions(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_group_id ON payment_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_member_id ON payment_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_group_id ON group_expenses(group_id);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups table
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- RLS Policies for group_members table
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can add members"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_members.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
    OR
    group_members.user_id = auth.uid()
  );

CREATE POLICY "Users can update their own member info"
  ON group_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for payment_requests table
CREATE POLICY "Users can view payment requests in their groups"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = payment_requests.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can create payment requests"
  ON payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = payment_requests.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

CREATE POLICY "Members can update their own payment requests"
  ON payment_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.id = payment_requests.member_id
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policies for transactions table
CREATE POLICY "Users can view transactions in their groups"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = transactions.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = transactions.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policies for group_expenses table
CREATE POLICY "Users can view expenses in their groups"
  ON group_expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expenses"
  ON group_expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
    )
    AND paid_by = auth.uid()
  );

CREATE POLICY "Users can update their own expenses"
  ON group_expenses FOR UPDATE
  TO authenticated
  USING (paid_by = auth.uid());