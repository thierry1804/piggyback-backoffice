export interface Role {
  id: string;
  label: string;
}

export interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: unknown;
  created_at: string | null;
  role_id: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
}

export interface UserGroup {
  user_id: string;
  group_id: string;
  role: string;
}

export interface UserWithRoleLabel extends User {
  role_label?: string | null;
}

export interface UserGroupWithGroup extends UserGroup {
  group: Group | null;
}
