export const createTask = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      userId
      title
      description
      status
      priority
      dueDate
      category
      startDate
      endDate
      projectId
      assigneeId
      labels
      comments
      recurrenceRule
      recurrenceExceptions
      originalTodoId
      reminderSetting
      attachment {
        key
        name
        type
        size
      }
      createdAt
      updatedAt
    }
  }
`;

export const updateTask = `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
      userId
      title
      description
      status
      priority
      dueDate
      category
      startDate
      endDate
      projectId
      assigneeId
      labels
      comments
      recurrenceRule
      recurrenceExceptions
      originalTodoId
      reminderSetting
      attachment {
        key
        name
        type
        size
      }
      createdAt
      updatedAt
    }
  }
`;

export const deleteTask = `
  mutation DeleteTask($input: DeleteTaskInput!) {
    deleteTask(input: $input) {
      id
    }
  }
`;
