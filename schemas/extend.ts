import { mergeSchemas } from "@graphql-tools/schema";
import axios from "axios";
import gql from "graphql-tag";

const GEMINI_API_KEY =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=GEMINI_API_KEY";
const API_KEY = process.env.GEMINI_API_KEY;

export const extendGraphqlSchema = (schema: any) =>
  mergeSchemas({
    schemas: [schema],
    typeDefs: gql`
      type RegisterResponse {
        user: User
      }

      type PodcastRecomendation {
        id: ID!
        title: String!
        category: String!
        video_uri: String
        artwork: String
        lyricist: String
        type: String!
        audio_uri: String
        artist: ArtistInfo
        isFavourite: Boolean!
      }

      type ArtistInfo {
        id: ID!
        name: String!
        bio: String
        photo: String
      }

      extend type Mutation {
        registerUser(
          name: String!
          email: String!
          password: String!
        ): RegisterResponse
      }

      extend type Query {
        getRecommendedPodcasts(userId: ID!): [PodcastRecomendation]
      }
    `,

    resolvers: {
      Mutation: {
        registerUser: async (root, { name, email, password }, context) => {
          const existingUser = await context.db.User.findOne({
            where: { email },
          });

          if (existingUser) {
            throw new Error("User already exists");
          }

          const newUser = await context.db.newUser.createOne({
            data: { name, email, password },
          });
          return { user: newUser };
        },
      },

      Query: {
        getRecommendedPodcasts: async (_, { userId }, context) => {
          try {
            const user = await context.db.User.findOne({
              where: { id: userId },
              query: "id favoritePodcasts { id title category }",
            });

            if (!user) throw new Error("User not found");

            const favoritePodcasts = user.favoritePodcasts || [];
            const favoriteCategories = [
              ...new Set(favoritePodcasts.map((p: any) => p.category)),
            ];

            const allPodcasts = await context.db.Podcast.findMany({
              query: `
                id 
                title
                category
                video_uri
                artwork
                lyricist
                type
                audio_uri
                artist {
                  id
                  name
                  bio
                  photo
                }
                `,
            });
            const favoritePodcastIds = favoritePodcasts.map((p: any) => p.id);
            const availablePodcasts = allPodcasts.filter(
              (p: any) => !favoritePodcastIds.includes(p.id)
            );

            if (availablePodcasts.length === 0) {
              return [];
            }

            const prompt = `You are a podcast recommendation engine.
            The user has listened to the following podcasts: ${
              favoriteCategories?.length
                ? favoriteCategories?.join(", ")
                : "None"
            }.

            From the following list of podcasts, recommend 3 that the user might like:
${
  availablePodcasts?.length
    ? availablePodcasts
        .map(
          (p: any) =>
            `${p.title} (Category${p?.category}, (Artist: ${p?.artist?.name})`
        )
        .join("\n")
    : "No Podcasts Available"
}

    Return only the titles in this JSON format:
    {
    "recommendations": ["Title 1", ""Title 2", "Title 3"]
    }
`;

            const response = await axios.post(
              `{GEMINI_API_KEY}?key=${API_KEY}`,
              {
                contents: [
                  {
                    parts: [{ text: prompt }],
                  },
                ],
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const aiResponse =
              response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);

            if (!jsonMatch) {
              throw new Error("AI response format is incorrect");
            }

            const jsonString = jsonMatch[1];
            const { recommendations } = JSON.parse(jsonString);

            if (!Array) {
              throw new Error("Recommendations are not in the expected format");
            }

            const matchedPodcasts = allPodcasts.filter((p: any) =>
              recommendations.includes(p.title)
            );

            const podcastWithArtist = matchedPodcasts?.map((podcast: any) => {
              return {
                ...podcast,
                artist: {
                  bio: "AI generated Suggestion from your favourite ad similar to podcast that you used to watch",
                  id: 123,
                  name: "AI Generate",
                  photo:
                    "https://www.google.com/imgres?q=ai%20images&imgurl=https%3A%2F%2Fmiro.medium.com%2Fv2%2Fresize%3Afit%3A1400%2F1*GfkQDoOm35w_kipsUMN7vw.png&imgrefurl=https%3A%2F%2Fgenerativeai.pub%2F5-best-ai-art-generators-free-for-commercial-use-1bd5f1a29010&docid=O8kcEZotp34biM&tbnid=BBI9-8JBFVrv8M&vet=12ahUKEwj-w9mE5NeMAxXqyzgGHQPZITQ4ChAzegQIGRAA..i&w=1400&h=1123&hcb=2&ved=2ahUKEwj-w9mE5NeMAxXqyzgGHQPZITQ4ChAzegQIGRAA",
                },
              };
            });
            return podcastWithArtist;
          } catch (error) {
            console.error("Error fetching recommended podcasts:", error);
            throw new Error("Failed to fetch recommended podcasts");
          }
        },
      },
    },
  });
