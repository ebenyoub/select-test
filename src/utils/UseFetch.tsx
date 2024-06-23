import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

type FetchState = {
  data: string[];
  loading: boolean;
  error: AxiosError | null;
  success: boolean;
  hasMore: boolean;
}

/**
 * Hook personnalisé pour récupérer les données d'utilisateurs paginées depuis une API.
 *
 * @param {number} skip - Le nombre d'utilisateurs à sauter (pour la pagination).
 * @param {number} limit - Le nombre d'utilisateurs à récupérer par requête.
 * @returns {FetchState} L'état contenant les données des utilisateurs, le statut de chargement, les erreurs, le statut de réussite et le drapeau hasMore.
 */
export default function UseFetch(skip:number, limit: number) {
  const [state, setState] = useState<FetchState>({
    data: [],
    loading: false,
    error: null,
    success: false,
    hasMore: false
  })
  
  
  useEffect(() => {
    const fetchData = async () => {
      const url = `https://dummyjson.com/users?limit=${limit}&skip=${skip}&select=firstName,lastName`;
      setState(prev => ({
        ...prev,
        loading: true
      }))

      const formatName = (users: User[]) => {
        return users.map((user: User) => `${user.firstName} ${user.lastName}`)
      } 

      try {
        const response = await axios.get(url)
        setState(prev => ({
          ...prev,
          data: skip === 0 ? formatName(response.data.users) : [...prev.data, ...formatName(response.data.users)],
          loading: false,
          success: true,
          hasMore: response.data.total > skip + limit 
        }))
      } catch(err) {
        if (axios.isAxiosError(err)) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err,
            success: false
          }))
        } else {
          setState(prev => ({
            ...prev,
            error: new Error("An unexpected error occurred") as AxiosError
          }));
        }
      }
    }

    fetchData();
  }, [skip, limit])

  return state;
}
