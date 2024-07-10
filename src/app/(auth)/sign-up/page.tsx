'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"        // Linkage!
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
// import { useRouter } from "next/router"
import { signUpSchema } from "@/schemas/signUpSchema"
import axios,{ AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse"
// import { useDebouncedCallback } from '@mantine/hooks';
// 'usehooks-ts'
import { useDebounceCallback } from "usehooks-ts";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"


const page = () => {
  const [username, setUsername] = useState('')
  const [usernameMessage, setUsernameMessage] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const debounced = useDebounceCallback(setUsername, 300)      // check for useDebounceValue;
  const { toast } = useToast()
  const router = useRouter();
  
  // Zod implementation

  // form or register || 
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: ''
    }
  })

  useEffect(() => {
    const checkUsernameUnique = async () => {
      if (username) {
        setIsCheckingUsername(true);
        setUsernameMessage(''); // Reset message
        try {
          const response = await axios.get<ApiResponse>(
            `/api/check-username-unique?username=${username}`
          );
          setUsernameMessage(response.data.message);
        } catch (error) {
          const axiosError = error as AxiosError<ApiResponse>;
          setUsernameMessage(
            axiosError.response?.data.message ?? 'Error checking username'
          );
        } finally {
          setIsCheckingUsername(false);
        }
      }
    };
    checkUsernameUnique();
  }, [username]);

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ApiResponse>('/api/sign-up', data);

      toast({
        title: 'Success',
        description: response.data.message,
      });

      router.replace(`/verify/${username}`);

      setIsSubmitting(false);
    } catch (error) {
      console.error('Error during sign-up:', error);

      const axiosError = error as AxiosError<ApiResponse>;

      // Default error message
      let errorMessage = axiosError.response?.data.message;
      ('There was a problem with your sign-up. Please try again.');

      toast({
        title: 'Sign Up Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
          Join AnonFeed
        </h1>
        <p className="mb-4">Sign up to start your anonymous feedback / message adventure</p>
        </div>
          <Form {...form}>
            <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6">
            <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username"
                   {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    debounced(e.target.value)
                  }} 
                  />
                </FormControl>
                {isCheckingUsername && <Loader2 className="animate-spin" />}
                <p className={`text-sm ${usernameMessage === "Username is unique" ? 'text-green-500' : 'text-red-500'}`}>{usernameMessage} </p>
                <FormMessage />
              </FormItem>
            )}
          />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>email</FormLabel>
                <FormControl>
                  <Input placeholder="email"
                   {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="password"
                   {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {
              isSubmitting ? (
                <>
                  <Loader2  className="mr-2 h-4 animate-spin"/> Please wait
                </>
              ) : ( 'Signup' )
            }
          </Button>
          </form>

          </Form>
          <div className="text-center mt-4">
            <p>
              Already a member? {''}
              <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
                Sign in
              </Link>
            </p>
          </div>
      </div>
    </div>
  )
}

export default page
