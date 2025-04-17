
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-campus-light to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-campus-primary">CampusCare</h1>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="bg-campus-primary hover:bg-campus-primary/90" asChild>
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        </header>

        <main className="mt-20 md:mt-32 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
              Your Voice, <span className="text-campus-primary">Our Solution</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              Report and track campus issues easily. From parking problems to infrastructure concerns, 
              we're here to make your campus experience better.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-campus-primary hover:bg-campus-primary/90" asChild>
                <Link to="/register">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="bg-campus-primary p-6">
              <h3 className="text-white text-lg font-medium">How It Works</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-campus-primary/10 flex items-center justify-center text-campus-primary font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Sign Up</h4>
                  <p className="text-sm text-gray-600">Create an account with your college email</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-campus-primary/10 flex items-center justify-center text-campus-primary font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Report an Issue</h4>
                  <p className="text-sm text-gray-600">Submit details of the problem with photos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-campus-primary/10 flex items-center justify-center text-campus-primary font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Track Progress</h4>
                  <p className="text-sm text-gray-600">Stay updated on the status of your report</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-campus-primary/10 flex items-center justify-center text-campus-primary font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Problem Solved</h4>
                  <p className="text-sm text-gray-600">Get notified when the issue is resolved</p>
                </div>
              </div>
            </div>
          </div>
        </main>

       
      </div>
    </div>
  );
};

export default Index;
