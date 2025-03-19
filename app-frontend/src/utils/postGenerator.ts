export const generateLinkedInPost = (
  type: 'blog' | 'video',
  url: string,
  content: string
): string => {
  // In a real application, this would call an API or use AI to generate the post
  // For demo purposes, we'll use templates based on the input type
  
  const contentToUse = content || 'This is a placeholder for your content.';
  
  // Extract a title from the content (first line or first sentence)
  const title = contentToUse.split('\n')[0].substring(0, 60) + '...';
  
  if (type === 'blog') {
    return `🔥 Just read an amazing article: "${title}"

Here are my 3 key takeaways:

1️⃣ ${getRandomTakeaway()}
2️⃣ ${getRandomTakeaway()}
3️⃣ ${getRandomTakeaway()}

This completely changed how I think about this topic. I'd love to hear your thoughts on this!

${url ? `Read the full article here: ${url}` : ''}

#ProfessionalDevelopment #Learning #Growth`;
  } else {
    return `📺 I just watched an incredible video that I had to share!

"${title}"

My top insights:
• ${getRandomTakeaway()}
• ${getRandomTakeaway()}
• ${getRandomTakeaway()}

This video offers practical advice that you can implement right away.

${url ? `Watch it here: ${url}` : ''}

What's your favorite resource on this topic?

#VideoInsights #ProfessionalGrowth #MustWatch`;
  }
};

// Helper function to generate random takeaways for the demo
const getRandomTakeaway = (): string => {
  const takeaways = [
    "Focus on building relationships before you need them",
    "Consistency beats intensity when it comes to long-term success",
    "The most successful people are often the most curious",
    "Embracing failure is essential for innovation",
    "Your network determines your net worth",
    "Time management is really attention management",
    "The best leaders ask more questions than they answer",
    "Invest in skills that will be valuable in 5-10 years",
    "Authenticity resonates more than perfection",
    "Small daily improvements lead to remarkable results over time"
  ];
  
  return takeaways[Math.floor(Math.random() * takeaways.length)];
};