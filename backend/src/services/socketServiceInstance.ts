import SocketService from './socketService';

let socketService: SocketService | null = null;

export const setSocketService = (instance: SocketService) => {
  socketService = instance;
};

export const getSocketService = (): SocketService | null => socketService;

export default socketService;
