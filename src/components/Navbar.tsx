'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { User } from 'next-auth';
import axios from 'axios';
import { useDebounceCallback } from 'usehooks-ts';

const Navbar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const user: User = session?.user as User;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/sign-in');
  };

  const fetchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`/api/get-users?query=${query}`);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const debouncedFetchUsers = useDebounceCallback(fetchUsers, 300);

  useEffect(() => {
    debouncedFetchUsers(searchQuery);
  }, [searchQuery, debouncedFetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserClick = (username: string | undefined) => {
    if (username) {
      setSearchQuery('');
      setSearchResults([]);
      router.push(`/profile/${username}`);
    }
  };

  return (
    <nav className="p-4 md:p-6 shadow-md bg-gray-900 text-white">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <a href="/dashboard" className="text-xl font-bold mb-4 md:mb-0">
          AnonFeed
        </a>
        {session ? (
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="input input-bordered w-full p-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search users..."
            />
            {searchResults.length > 0 && (
              <ul className="absolute left-0 right-0 bg-white text-black mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
                {searchResults.map((result) => (
                  <li
                    key={result._id}
                    className="p-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleUserClick(result.username)}
                  >
                    {result.username}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex space-x-4">
            <Link href="/sign-in">
              <Button className="w-full md:w-auto bg-slate-100 text-black" variant="outline">Login</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="w-full md:w-auto bg-slate-100 text-black" variant="outline">Sign Up</Button>
            </Link>
          </div>
        )}
        {session && (
          <div className="flex items-center space-x-4">
            <span className="mr-4">
              Welcome, {user?.username || user?.email}
            </span>
            <Button onClick={handleSignOut} className="w-full md:w-auto bg-slate-100 text-black" variant='outline'>
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
