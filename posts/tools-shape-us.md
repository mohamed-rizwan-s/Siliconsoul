---
title: We Shape Our Tools, and Thereafter Our Tools Shape Us
date: 2026-02-01
description: Every time an AI agent moves a file for you or edits your config, you're not just skipping the boring work. You're skipping the comprehension.
tags: [ai, learning, productivity, engineering, cognition]
cover: /assets/clawd.jpg
author: Mohamed Rizwan
---

I keep thinking about that Marshall McLuhan line—"we shape our tools, and thereafter our tools shape us." It's basically a tech writing cliché at this point, the kind of thing you see in every other Substack essay about AI. But I'm going to use it anyway because... well, Clawdbot exists now. And suddenly that quote doesn't feel like a metaphor anymore. It feels like a warning.

## Your Computer Is Not a Taxi

Here's what actually worries me about these new "computer use" agents. Yes, the security people are losing their minds over prompt injection—and fair enough, imagine a website with white-on-white text telling your AI to email your password to a stranger. That's bad. But that's not the part that keeps me up at night.

The part that gets me is this: every time Clawdbot moves a file for you, or edits some config, or "fixes" your Docker setup, you're not just skipping the boring work. You're skipping the comprehension.

Ben Thompson wrote about Aggregation Theory—how Uber makes the taxi dispatch system invisible, so you don't need to know how cab distribution works. Great. I love not thinking about taxis. But my terminal isn't a taxi. Steve Jobs called computers "bicycles for the mind." Right now we're adding training wheels that are actually... I don't know, sedatives? Something that makes you forget how to balance.

When Clawdbot clicks around your desktop, taking screenshots and injecting mouse movements, it puts a wall between you and the machine. You see the file got moved. You don't feel that weird half-second lag that would have told you your drive is failing. You don't notice the dependency conflict that would have taught you why version pinning exists. You don't stumble into some weird config file and think "huh, so that's how this actually works."

Gergely Orosz talks about how senior engineers have these mental models of their systems. You build those models through friction—through the error message at 2am, through the failed build that takes three hours to fix, through manually grepping logs until you find the bug. Clawdbot removes the friction. And when you remove the friction, you stop building the model.

## The Generation Effect

Audrey Watters has been documenting edtech's failures for years. She'd recognize this pattern immediately. Every decade some new machine promises to "liberate" students from the drudgery of learning math, or coding, or whatever. And every time, it works—you're liberated from the drudgery, sure, but also from the actual learning.

Scott Young writes about the "generation effect." You remember what you struggle to create, not what you passively consume. When you write a SQL query manually, you screw up the syntax three times, you fix the join, you debug the null handling. That struggle burns the logic into your brain. When you just tell Clawdbot "get the user data" and it spits out a query, you're not engineering. You're doing ventriloquism with a very smart dummy.

Jennifer Gonzalez and Vicki Davis call the good kind of difficulty "productive struggle"—that sweet spot where something's hard enough to hurt a little but possible enough to finish. Clawdbot doesn't care about that sweet spot. It just removes the struggle entirely. Everything becomes a black box. You type English, magic happens, results appear.

I'm not worried about junior devs "cheating" with Clawdbot. I'm worried they'll never get that spidey sense—the thing that makes you go "wait, that feels wrong" when you're about to delete production. They'll become prompt engineers for their own computers. And when Clawdbot eventually hallucinates a command to wipe your drive because it misread a pixel, they won't know what happened or why.

## It's Just RATware

John Gruber usually writes precisely about Apple's privacy moves. He'd hate this. Clawdbot is basically a remote admin tool with a language model frontend. It takes screenshots of your screen. It parses what it sees. It clicks for you. That's not an assistant; that's remote access malware we voluntarily installed because we were too lazy to type "git commit."

Casey Newton writes about how platforms lock you in. This is that, but worse. If Clawdbot becomes how you use your computer, then you don't have a computer anymore. You have a Clawdbot terminal. Your files, your weird little workflows, the specific way you organize your desktop—all of it becomes training data for someone else's model. The vendors call this "democratizing computing." But democracy needs informed citizens, not people who need an AI to find a file.

## Keep the Manual Transmission

I'm not saying smash the machines. Use them like interns. Let them draft, you edit. Let them suggest, you decide.

Paul Graham says startups die when founders lose the "founder's touch"—when they stop doing the actual work themselves. Same thing happens to people. Keep your manual transmission engaged. That's where the tacit knowledge lives—the smell test for bad configs, the muscle memory of bash, the spatial sense of where your files live.

The trade is simple: infinite convenience for gradual deskilling. You hand over the keys to your digital house so you don't have to remember where you put them.

Just keep your hands on the keyboard. The code you write today—even the bad code, especially the bad code—is understanding you'll have tomorrow. Everything else is cargo culting. Elaborate rituals that look like competence but with nothing actually behind the screen.
