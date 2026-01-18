export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json;
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                };
                Returns: Json;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
    public: {
        Tables: {
            ai_usage_logs: {
                Row: {
                    created_at: string;
                    id: string;
                    input_tokens: number | null;
                    model_used: string;
                    operation: string;
                    output_tokens: number | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    input_tokens?: number | null;
                    model_used: string;
                    operation: string;
                    output_tokens?: number | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    input_tokens?: number | null;
                    model_used?: string;
                    operation?: string;
                    output_tokens?: number | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'ai_usage_logs_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            children: {
                Row: {
                    bio: string | null;
                    birth_date: string | null;
                    created_at: string;
                    display_name: string;
                    group_id: string;
                    id: string;
                    parent_id: string;
                };
                Insert: {
                    bio?: string | null;
                    birth_date?: string | null;
                    created_at?: string;
                    display_name: string;
                    group_id: string;
                    id?: string;
                    parent_id: string;
                };
                Update: {
                    bio?: string | null;
                    birth_date?: string | null;
                    created_at?: string;
                    display_name?: string;
                    group_id?: string;
                    id?: string;
                    parent_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'children_group_id_fkey';
                        columns: ['group_id'];
                        isOneToOne: false;
                        referencedRelation: 'groups';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'children_parent_id_fkey';
                        columns: ['parent_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            event_comments: {
                Row: {
                    author_id: string;
                    content: string;
                    created_at: string;
                    event_id: string;
                    id: string;
                    is_pinned: boolean;
                };
                Insert: {
                    author_id: string;
                    content: string;
                    created_at?: string;
                    event_id: string;
                    id?: string;
                    is_pinned?: boolean;
                };
                Update: {
                    author_id?: string;
                    content?: string;
                    created_at?: string;
                    event_id?: string;
                    id?: string;
                    is_pinned?: boolean;
                };
                Relationships: [
                    {
                        foreignKeyName: 'event_comments_author_id_fkey';
                        columns: ['author_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'event_comments_event_id_fkey';
                        columns: ['event_id'];
                        isOneToOne: false;
                        referencedRelation: 'events';
                        referencedColumns: ['id'];
                    },
                ];
            };
            event_guests: {
                Row: {
                    child_id: string;
                    created_at: string;
                    event_id: string;
                };
                Insert: {
                    child_id: string;
                    created_at?: string;
                    event_id: string;
                };
                Update: {
                    child_id?: string;
                    created_at?: string;
                    event_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'event_guests_child_id_fkey';
                        columns: ['child_id'];
                        isOneToOne: false;
                        referencedRelation: 'children';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'event_guests_event_id_fkey';
                        columns: ['event_id'];
                        isOneToOne: false;
                        referencedRelation: 'events';
                        referencedColumns: ['id'];
                    },
                ];
            };
            events: {
                Row: {
                    child_id: string | null;
                    created_at: string;
                    description: string | null;
                    event_date: string;
                    group_id: string;
                    id: string;
                    organizer_id: string;
                    title: string;
                    updated_at: string;
                };
                Insert: {
                    child_id?: string | null;
                    created_at?: string;
                    description?: string | null;
                    event_date: string;
                    group_id: string;
                    id?: string;
                    organizer_id: string;
                    title: string;
                    updated_at?: string;
                };
                Update: {
                    child_id?: string | null;
                    created_at?: string;
                    description?: string | null;
                    event_date?: string;
                    group_id?: string;
                    id?: string;
                    organizer_id?: string;
                    title?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'events_child_id_fkey';
                        columns: ['child_id'];
                        isOneToOne: false;
                        referencedRelation: 'children';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'events_group_id_fkey';
                        columns: ['group_id'];
                        isOneToOne: false;
                        referencedRelation: 'groups';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'events_organizer_id_fkey';
                        columns: ['organizer_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            group_invites: {
                Row: {
                    code: string;
                    created_at: string;
                    created_by: string;
                    expires_at: string;
                    group_id: string;
                };
                Insert: {
                    code: string;
                    created_at?: string;
                    created_by: string;
                    expires_at: string;
                    group_id: string;
                };
                Update: {
                    code?: string;
                    created_at?: string;
                    created_by?: string;
                    expires_at?: string;
                    group_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'group_invites_created_by_fkey';
                        columns: ['created_by'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'group_invites_group_id_fkey';
                        columns: ['group_id'];
                        isOneToOne: false;
                        referencedRelation: 'groups';
                        referencedColumns: ['id'];
                    },
                ];
            };
            group_members: {
                Row: {
                    group_id: string;
                    joined_at: string;
                    role: Database['public']['Enums']['group_role'];
                    user_id: string;
                };
                Insert: {
                    group_id: string;
                    joined_at?: string;
                    role?: Database['public']['Enums']['group_role'];
                    user_id: string;
                };
                Update: {
                    group_id?: string;
                    joined_at?: string;
                    role?: Database['public']['Enums']['group_role'];
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'group_members_group_id_fkey';
                        columns: ['group_id'];
                        isOneToOne: false;
                        referencedRelation: 'groups';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'group_members_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            groups: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    id: string;
                    name: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    name: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    name?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'groups_created_by_fkey';
                        columns: ['created_by'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            profiles: {
                Row: {
                    created_at: string;
                    email: string | null;
                    first_name: string;
                    id: string;
                };
                Insert: {
                    created_at?: string;
                    email?: string | null;
                    first_name: string;
                    id: string;
                };
                Update: {
                    created_at?: string;
                    email?: string | null;
                    first_name?: string;
                    id?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            group_role: 'admin' | 'member';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            group_role: ['admin', 'member'],
        },
    },
} as const;
