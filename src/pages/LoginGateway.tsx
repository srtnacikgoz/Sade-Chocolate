import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// LoginGateway artık kullanılmıyor, Account sayfasına yönlendirir
export const LoginGateway: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/account', { replace: true });
  }, [navigate]);

  return null;
};
