// lib/auth.ts

export const restoreAuth = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/api/auth/refresh`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  return data;
};