import axios from 'axios';
import { Task } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAllTasks = async (): Promise<Task[]> => {
  const response = await api.get('/tasks');
  return response.data.map((item: any) => ({ ...item, id: item._id }));
};

export const getTaskById = async (id: string): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return { ...response.data, id: response.data._id };
};

export const createTask = async (taskData: Omit<Task, 'id'>): Promise<Task> => {
  const response = await api.post('/tasks', taskData);
  return { ...response.data, id: response.data._id };
};

export const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
  const response = await api.patch(`/tasks/${id}`, taskData);
  return { ...response.data, id: response.data._id };
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const convertSuggestedToActualTask = async (id: string): Promise<Task> => {
  // We can reuse the update endpoint for this specific operation
  const response = await api.patch(`/tasks/${id}`, { suggested: false });
  return { ...response.data, id: response.data._id };
};
