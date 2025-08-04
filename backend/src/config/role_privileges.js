module.exports = {
    privGroups: [
        {
            id: "USERS",
            name: "User Permissions",
        },
        {
            id: "ROLES",
            name: "Role Permissions",
        },
        {
            id: "AUDIT_LOGS",
            name: "AuditLogs Permissions",
        },
        {
            id: "CONTENT",
            name: "Content Permissions",

        } 
    ],

    privileges: [
        {
            key: "user_view",
            name: "User View",
            group: "USERS",
            description: "Allows viewing user details"
        },
        {
            key: "user_add",
            name: "User Add",
            group: "USERS",
            description: "Allows adding new users"
        },
        {
            key: "user_update",
            name: "User Update",
            group: "USERS",
            description: "Allows updating user details"
        },
        {
            key: "user_delete",
            name: "User Delete",
            group: "USERS",
            description: "Allows deleting users"
        },
        {
            key: "role_view",
            name: "Role View",
            group: "ROLES",
            description: "Allows viewing role details"
        },
        {
            key: "role_add",
            name: "Role Add",
            group: "ROLES",
            description: "Allows adding new roles"
        },
        {
            key: "role_update",
            name: "Role Update",
            group: "ROLES",
            description: "Allows updating role details"
        },
        {
            key: "role_delete",
            name: "Role Delete",
            group: "ROLES",
            description: "Allows deleting roles"
        },
        {
            key: "audit_log_view",
            name: "Audit Log View",
            group: "AUDIT_LOGS",
            description: "Allows viewing audit logs"
        },
        {
            key: "content_view",
            name: "Content View",
            group: "CONTENT",
            description: "Allows viewing content"
        },
        {
            key: "content_add",
            name: "Content Add",
            group: "CONTENT",
            description: "Allows adding new content"
        },
        {
            key: "content_update",
            name: "Content Update",
            group: "CONTENT",
            description: "Allows updating existing content"
        },
        {
            key: "content_delete",
            name: "Content Delete",
            group: "CONTENT",
            description: "Allows deleting content"
        }
    ]
}