export const getTask = `
  query GetTask($id: ID!) {
    getTask(id: $id) {
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

export const listTasks = `
  query ListTasks(
    $filter: ModelTaskFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`;
