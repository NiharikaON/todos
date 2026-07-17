export const LIST_TODOS = `
  query ListTodos($userId: String!) {
    listTodos(userId: $userId) {
      id
      title
      description
      status
      priority
      dueDate
      startDate
      endDate
      createdAt
      updatedAt
      projectId
      assigneeId
      labels
      comments
      userId
      attachments {
        key
        name
        type
        size
      }
      recurrenceRule
      recurrenceExceptions
      originalTodoId
      reminderSetting
    }
  }
`;

export const GET_TODO = `
  query GetTodo($id: ID!) {
    getTodo(id: $id) {
      id
      title
      description
      status
      priority
      dueDate
      startDate
      endDate
      createdAt
      updatedAt
      projectId
      assigneeId
      labels
      comments
      userId
      attachments {
        key
        name
        type
        size
      }
      recurrenceRule
      recurrenceExceptions
      originalTodoId
      reminderSetting
    }
  }
`;

export const CREATE_TODO = `
  mutation CreateTodo($id: ID!, $title: String!, $description: String, $status: String, $priority: String, $dueDate: AWSDateTime, $startDate: AWSDateTime, $endDate: AWSDateTime, $projectId: String, $assigneeId: String, $userId: String!, $attachments: [AttachmentInput!], $labels: [String!], $comments: [String!], $recurrenceRule: String, $recurrenceExceptions: [String!], $originalTodoId: ID, $reminderSetting: String) {
    createTodo(id: $id, title: $title, description: $description, status: $status, priority: $priority, dueDate: $dueDate, startDate: $startDate, endDate: $endDate, projectId: $projectId, assigneeId: $assigneeId, userId: $userId, attachments: $attachments, labels: $labels, comments: $comments, recurrenceRule: $recurrenceRule, recurrenceExceptions: $recurrenceExceptions, originalTodoId: $originalTodoId, reminderSetting: $reminderSetting) {
      id
      title
      description
      status
      priority
      dueDate
      startDate
      endDate
      createdAt
      updatedAt
      projectId
      assigneeId
      labels
      comments
      userId
      attachments {
        key
        name
        type
        size
      }
      recurrenceRule
      recurrenceExceptions
      originalTodoId
      reminderSetting
    }
  }
`;

export const UPDATE_TODO = `
  mutation UpdateTodo(
    $id: ID!,
    $title: String,
    $description: String,
    $status: String,
    $priority: String,
    $dueDate: AWSDateTime,
    $startDate: AWSDateTime,
    $endDate: AWSDateTime,
    $projectId: String,
    $assigneeId: String,
    $userId: String!,
    $attachments: [AttachmentInput!],
    $labels: [String!],
    $comments: [String!],
    $recurrenceRule: String,
    $recurrenceExceptions: [String!],
    $originalTodoId: ID,
    $reminderSetting: String
  ) {
    updateTodo(
      id: $id,
      title: $title,
      description: $description,
      status: $status,
      priority: $priority,
      dueDate: $dueDate,
      startDate: $startDate,
      endDate: $endDate,
      projectId: $projectId,
      assigneeId: $assigneeId,
      userId: $userId,
      attachments: $attachments,
      labels: $labels,
      comments: $comments,
      recurrenceRule: $recurrenceRule,
      recurrenceExceptions: $recurrenceExceptions,
      originalTodoId: $originalTodoId,
      reminderSetting: $reminderSetting
    ) {
      id
      title
      description
      status
      priority
      dueDate
      startDate
      endDate
      createdAt
      updatedAt
      projectId
      assigneeId
      labels
      comments
      userId
      attachments {
        key
        name
        type
        size
      }
      recurrenceRule
      recurrenceExceptions
      originalTodoId
      reminderSetting
    }

  }
`;

export const DELETE_TODO = `
  mutation DeleteTodo($id: ID!, $userId: String!) {
    deleteTodo(id: $id, userId: $userId) {
      id
    }
  }
`;

export const ON_TODO_CREATED = `
  subscription OnTodoCreated($userId: String!) {
    onTodoCreated(userId: $userId) {
      id
      title
      status
      userId
    }
  }
`;

export const ON_TODO_UPDATED = `
  subscription OnTodoUpdated($userId: String!) {
    onTodoUpdated(userId: $userId) {
      id
      title
      status
      userId
    }
  }
`;

export const ON_TODO_DELETED = `
  subscription OnTodoDeleted($userId: String!) {
    onTodoDeleted(userId: $userId) {
      id
    }
  }
`;
