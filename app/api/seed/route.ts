
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Meeting } from '@/app/models/Meeting';
import { Task } from '@/app/models/Task';
import { User } from '@/app/models/User';
import mongoose from 'mongoose';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return NextResponse.json({ error: 'Unauthorized: No user logged in' }, { status: 401 });
    }

    await connectToDatabase();

    const currentUser = await User.findOne({ clerkId });

    if (!currentUser) {
        return NextResponse.json({ error: 'User not found in database. Please sign in to sync user.' }, { status: 404 });
    }

    const userId = currentUser._id;
    const seededMeetings = [];

    // Meeting 1: Product Strategy
    const meeting1Id = new mongoose.Types.ObjectId();
    const tasks1 = [
        // 3 Actual Tasks
        {
            title: "Define Q3 Roadmap",
            description: "Outline key deliverables for the upcoming quarter.",
            priority: "High",
            status: "In Progress",
            tags: ["Strategy", "Product"],
            sourceMeeting: meeting1Id,
            suggested: false,
            user: userId
        },
        {
            title: "Review Competitor Analysis",
            description: "Analyze new features released by competitors.",
            priority: "Medium",
            status: "Backlog",
            tags: ["Research", "Market"],
            sourceMeeting: meeting1Id,
            suggested: false,
             user: userId
        },
        {
            title: "Update Stakeholder Deck",
            description: "Prepare slides for the monthly review.",
            priority: "High",
            status: "Completed",
            tags: ["Stakeholders", "Presentation"],
            sourceMeeting: meeting1Id,
            suggested: false,
             user: userId
        },
        // 3 Suggested Tasks
        {
            title: "Schedule Follow-up with Design",
            description: "AI Suggested: Discuss UI implications of new roadmap.",
            priority: "Medium",
            status: "Backlog",
            tags: ["Design", "AI-Suggested"],
            sourceMeeting: meeting1Id,
            suggested: true,
             user: userId
        },
        {
            title: "Draft Release Notes",
            description: "AI Suggested: Start early draft for major features.",
            priority: "Low",
            status: "Backlog",
            tags: ["Documentation", "AI-Suggested"],
            sourceMeeting: meeting1Id,
            suggested: true,
             user: userId
        },
        {
            title: "Email Summary to Team",
            description: "AI Suggested: Send meeting recap to all attendees.",
            priority: "High",
            status: "Backlog",
            tags: ["Communication", "AI-Suggested"],
            sourceMeeting: meeting1Id,
            suggested: true,
             user: userId
        }
    ];

    const createdTasks1 = await Task.insertMany(tasks1);
    const taskIds1 = createdTasks1.map(t => t._id);

    const meeting1 = await Meeting.create({
        _id: meeting1Id,
        title: "Product Strategy Sync",
        date: new Date(),
        duration: "45:00",
        summary: "Discussed Q3 goals and competitive landscape. Defined key action items for the roadmap.",
        transcript: [
            { speakername: "Alice", content: "Let's focus on Q3 goals.", timestamp: "00:05" },
            { speakername: "Bob", content: "Agreed. We need to watch out for Competitor X.", timestamp: "02:15" }
        ],
        mom: [
            { type: "decision", content: "Focus on mobile-first features for Q3." },
            { type: "action", content: "Bob to finalize competitor report." }
        ],
        tags: ["Product", "Strategy"],
        category: "Product",
        tasks: taskIds1,
        videoUrl: 'https://picsum.photos/seed/meet1/800/450',
        user: userId
    });
    seededMeetings.push(meeting1);

    // Meeting 2: Engineering Standup
    const meeting2Id = new mongoose.Types.ObjectId();
    const tasks2 = [
         // 3 Actual Tasks
         {
            title: "Fix Login Bug",
            description: "Investigate intermittent failure in auth service.",
            priority: "High",
            status: "In Progress",
            tags: ["Bug", "Auth"],
            sourceMeeting: meeting2Id,
            suggested: false,
             user: userId
        },
        {
            title: "Refactor API Middleware",
            description: "Improve error handling in the API layer.",
            priority: "Medium",
            status: "Review",
            tags: ["Refactor", "Backend"],
            sourceMeeting: meeting2Id,
            suggested: false,
             user: userId
        },
        {
            title: "Update Documentation",
            description: "Update swagger docs with new endpoints.",
            priority: "Low",
            status: "Completed",
            tags: ["Docs"],
            sourceMeeting: meeting2Id,
            suggested: false,
             user: userId
        },
        // 3 Suggested Tasks
        {
            title: "Check Error Logs",
            description: "AI Suggested: Verify if auth errors increased.",
            priority: "High",
            status: "Backlog",
            tags: ["Monitoring", "AI-Suggested"],
            sourceMeeting: meeting2Id,
            suggested: true,
             user: userId
        },
        {
            title: "Set up Unit Tests",
            description: "AI Suggested: Add tests for the new middleware.",
            priority: "Medium",
            status: "Backlog",
            tags: ["Testing", "AI-Suggested"],
            sourceMeeting: meeting2Id,
            suggested: true,
             user: userId
        },
        {
            title: "Deploy to Staging",
            description: "AI Suggested: Verify fix in staging environment.",
            priority: "High",
            status: "Backlog",
            tags: ["DevOps", "AI-Suggested"],
            sourceMeeting: meeting2Id,
            suggested: true,
             user: userId
        }
    ];

    const createdTasks2 = await Task.insertMany(tasks2);
    const taskIds2 = createdTasks2.map(t => t._id);

    const meeting2 = await Meeting.create({
        _id: meeting2Id,
        title: "Engineering Daily Standup",
        date: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
        duration: "15:00",
        summary: "Quick sync on blocking issues. Discussed the login bug and API refactoring.",
        transcript: [
            { speakername: "Charlie", content: "I'm stuck on the login bug.", timestamp: "01:00" },
            { speakername: "Dave", content: "I can help you debug that after the meeting.", timestamp: "01:30" }
        ],
        mom: [
            { type: "info", content: "Login bug is priority #1." },
            { type: "action", content: "Charlie and Dave to pair program on the fix." }
        ],
        tags: ["Engineering", "Standup"],
        category: "Engineering",
        tasks: taskIds2,
        videoUrl: 'https://picsum.photos/seed/meet2/800/450',
        user: userId
    });
    seededMeetings.push(meeting2);

     // Meeting 3: Marketing Campaign Launch
     const meeting3Id = new mongoose.Types.ObjectId();
     const tasks3 = [
          // 3 Actual Tasks
          {
             title: "Approve Ad Creatives",
             description: "Finalize visuals for the social media campaign.",
             priority: "High",
             status: "In Progress",
             tags: ["Marketing", "Creative"],
             sourceMeeting: meeting3Id,
             suggested: false,
              user: userId
         },
         {
             title: "Setup Tracking Pixels",
             description: "Ensure analytics are tracking conversions correctly.",
             priority: "High",
             status: "Backlog",
             tags: ["Analytics", "Tech"],
             sourceMeeting: meeting3Id,
             suggested: false,
              user: userId
         },
         {
             title: "Write Blog Post",
             description: "Draft announcement post for the blog.",
             priority: "Medium",
             status: "Review",
             tags: ["Content", "Blog"],
             sourceMeeting: meeting3Id,
             suggested: false,
              user: userId
         },
         // 3 Suggested Tasks
         {
             title: "Budget Review",
             description: "AI Suggested: Confirm ad spend limit.",
             priority: "High",
             status: "Backlog",
             tags: ["Finance", "AI-Suggested"],
             sourceMeeting: meeting3Id,
             suggested: true,
              user: userId
         },
         {
             title: "Contact Influencers",
             description: "AI Suggested: Reach out to partners for boost.",
             priority: "Medium",
             status: "Backlog",
             tags: ["Outreach", "AI-Suggested"],
             sourceMeeting: meeting3Id,
             suggested: true,
              user: userId
         },
         {
             title: "Schedule Launch Tweet",
             description: "AI Suggested: Queue social posts for launch time.",
             priority: "Low",
             status: "Backlog",
             tags: ["Social", "AI-Suggested"],
             sourceMeeting: meeting3Id,
             suggested: true,
              user: userId
         }
     ];
 
     const createdTasks3 = await Task.insertMany(tasks3);
     const taskIds3 = createdTasks3.map(t => t._id);
 
     const meeting3 = await Meeting.create({
         _id: meeting3Id,
         title: "Marketing Campaign Launch",
         date: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
         duration: "60:00",
         summary: "Planning session for the upcoming Q3 campaign. Reviewed creatives and budget.",
         transcript: [
             { speakername: "Eve", content: "Are the creatives ready?", timestamp: "05:00" },
             { speakername: "Frank", content: "Almost, just need approval on the copy.", timestamp: "05:45" }
         ],
         mom: [
             { type: "decision", content: "Launch date set for next Monday." },
             { type: "action", content: "Eve to approve final copy by EOD." }
         ],
         tags: ["Marketing", "Launch"],
         category: "Marketing",
         tasks: taskIds3,
         videoUrl: 'https://picsum.photos/seed/meet3/800/450',
         user: userId
    });
    seededMeetings.push(meeting3);


    return NextResponse.json({ 
        message: 'Seeded successfully for user ' + currentUser.email, 
        meetings: seededMeetings 
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
}
