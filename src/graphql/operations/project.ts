export const LIST_PROJECTS = `
  query ListProjects($ownerId: String!) {
    listProjects(ownerId: $ownerId) {
      id
      name
      description
      ownerId
      createdAt
      updatedAt
      attachments {
        key
        name
        type
        size
      }
    }
  }
`;

export const GET_PROJECT = `
  query GetProject($id: ID!) {
    getProject(id: $id) {
      id
      name
      description
      ownerId
      createdAt
      updatedAt
      attachments {
        key
        name
        type
        size
      }
    }
  }
`;

export const CREATE_PROJECT = `
  mutation CreateProject($id: ID!, $name: String!, $description: String, $ownerId: String!, $attachments: [AttachmentInput!]) {
    createProject(id: $id, name: $name, description: $description, ownerId: $ownerId, attachments: $attachments) {
      id
      name
      description
      ownerId
      createdAt
      updatedAt
      attachments {
        key
        name
        type
        size
      }
    }
  }
`;

export const UPDATE_PROJECT = `
  mutation UpdateProject($id: ID!, $name: String, $description: String, $ownerId: String!, $attachments: [AttachmentInput!]) {
    updateProject(id: $id, name: $name, description: $description, ownerId: $ownerId, attachments: $attachments) {
      id
      name
      description
      ownerId
      createdAt
      updatedAt
      attachments {
        key
        name
        type
        size
      }
    }
  }
`;

export const DELETE_PROJECT = `
  mutation DeleteProject($id: ID!, $ownerId: String!) {
    deleteProject(id: $id, ownerId: $ownerId) {
      id
    }
  }
`;

export const ON_PROJECT_CREATED = `
  subscription OnProjectCreated($ownerId: String!) {
    onProjectCreated(ownerId: $ownerId) {
      id
      name
      description
      ownerId
      createdAt
      updatedAt
      attachments {
        key
        name
        type
        size
      }
    }
  }
`;

export const ON_PROJECT_UPDATED = `
  subscription OnProjectUpdated($ownerId: String!) {
    onProjectUpdated(ownerId: $ownerId) {
      id
      name
      description
      ownerId
      createdAt
      updatedAt
      attachments {
        key
        name
        type
        size
      }
    }
  }
`;

export const ON_PROJECT_DELETED = `
  subscription OnProjectDeleted($ownerId: String!) {
    onProjectDeleted(ownerId: $ownerId) {
      id
    }
  }
`;
