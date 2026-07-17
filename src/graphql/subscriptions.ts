export const onCreateTask = `
  subscription OnCreateTask($owner: String!) {
    onCreateTask(owner: $owner) {
      id
      title
      description
      completed
      priority
      dueDate
      owner
      createdAt
      updatedAt
    }
  }
`;

export const onUpdateTask = `
  subscription OnUpdateTask($owner: String!) {
    onUpdateTask(owner: $owner) {
      id
      title
      description
      completed
      priority
      dueDate
      owner
      createdAt
      updatedAt
    }
  }
`;

export const onDeleteTask = `
  subscription OnDeleteTask($owner: String!) {
    onDeleteTask(owner: $owner) {
      id
    }
  }
`;
