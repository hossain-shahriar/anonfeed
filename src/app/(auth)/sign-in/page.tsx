'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { signIn } from 'next-auth/react';
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
import { signInSchema } from "@/schemas/signInSchema"


const page = () => {
  
  const { toast } = useToast()
  const router = useRouter();
  
  // Zod implementation

  // form or register || 
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  })

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    const result = await signIn('credentials', {
      redirect: false,
      identifier: data.identifier,
      password: data.password,
    });

    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        toast({
          title: 'Login Failed',
          description: 'Incorrect username or password',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    }

    if (result?.url) {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
          Join AnonFeed
        </h1>
        <p className="mb-4">Sign in to start your anonymous feedback / message adventure</p>
        </div>
          <Form {...form}>
            <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6">
            <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email/Username</FormLabel>
                <FormControl>
                  <Input placeholder="email/username"
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
          <Button type="submit" >
            Signin
          </Button>
          </form>

          </Form>
          <div className="text-center mt-4">
            <p>
              Not a member? {''}
              <Link href="/sign-up" className="text-blue-600 hover:text-blue-800">
                Sign up
              </Link>
            </p>
          </div>
      </div>
    </div>
  )
}

export default page
