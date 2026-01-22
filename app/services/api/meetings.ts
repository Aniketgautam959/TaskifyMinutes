import axios from 'axios';
import { Meeting } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAllMeetings = async (): Promise<Meeting[]> => {
  const response = await api.get('/meetings');
  return response.data.map((item: any) => ({ ...item, id: item._id }));
};

export const getMeetingById = async (id: string): Promise<Meeting> => {
  const response = await api.get(`/meetings/${id}`);
  return { ...response.data, id: response.data._id };
};

export const deleteMeeting = async (id: string): Promise<void> => {
  await api.delete(`/meetings/${id}`);
};
