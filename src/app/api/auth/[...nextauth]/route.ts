import NextAuth from 'next-auth'
import { supabase } from '../../../../lib/supabase'

// Custom OAuth providers for each platform
const TrelloProvider = {
  id: 'trello',
  name: 'Trello',
  type: 'oauth',
  version: '2.0',
  authorization: {
    url: 'https://trello.com/1/OAuthAuthorizeToken',
    params: {
      response_type: 'token',
      scope: 'read,write,account',
      expiration: 'never'
    }
  },
  token: 'https://trello.com/1/OAuthGetAccessToken',
  userinfo: {
    url: 'https://api.trello.com/1/members/me',
    async request({ tokens, provider }) {
      const response = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${tokens.access_token}`)
      return await response.json()
    }
  },
  profile(profile) {
    return {
      id: profile.id,
      name: profile.fullName,
      email: profile.email,
      image: profile.avatarUrl,
      username: profile.username
    }
  },
  clientId: process.env.TRELLO_API_KEY,
  clientSecret: process.env.TRELLO_API_SECRET
}

const AsanaProvider = {
  id: 'asana',
  name: 'Asana',
  type: 'oauth',
  version: '2.0',
  authorization: {
    url: 'https://app.asana.com/-/oauth_authorize',
    params: {
      client_id: process.env.ASANA_CLIENT_ID,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/asana`,
      response_type: 'code'
    }
  },
  token: {
    url: 'https://app.asana.com/-/oauth_token',
    params: {
      grant_type: 'authorization_code'
    }
  },
  userinfo: {
    url: 'https://app.asana.com/api/1.0/users/me',
    params: {},
    async request(context) {
      const response = await fetch('https://app.asana.com/api/1.0/users/me', {
        headers: {
          Authorization: `Bearer ${context.tokens.access_token}`,
          Accept: 'application/json'
        }
      })
      const result = await response.json()
      return result.data
    }
  },
  profile(profile) {
    return {
      id: profile.gid,
      name: profile.name,
      email: profile.email,
      image: profile.photo?.image_128x128
    }
  },
  clientId: process.env.ASANA_CLIENT_ID,
  clientSecret: process.env.ASANA_CLIENT_SECRET,
  style: {
    logo: '/asana.svg',
    logoDark: '/asana.svg',
    bg: '#fff',
    text: '#000',
    bgDark: '#000',
    textDark: '#fff'
  }
}

const ClickUpProvider = {
  id: 'clickup',
  name: 'ClickUp',
  type: 'oauth',
  version: '2.0',
  authorization: {
    url: 'https://app.clickup.com/api',
    params: {
      client_id: process.env.CLICKUP_CLIENT_ID,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/clickup`,
      response_type: 'code',
      scope: 'read write'
    }
  },
  token: {
    url: 'https://api.clickup.com/api/v2/oauth/token',
    params: {
      grant_type: 'authorization_code'
    }
  },
  userinfo: {
    url: 'https://api.clickup.com/api/v2/user',
    params: {},
    async request(context) {
      const response = await fetch('https://api.clickup.com/api/v2/user', {
        headers: { Authorization: context.tokens.access_token }
      })
      const result = await response.json()
      return result.user
    }
  },
  profile(profile) {
    return {
      id: profile.id.toString(),
      name: profile.username,
      email: profile.email,
      image: profile.profilePicture
    }
  },
  clientId: process.env.CLICKUP_CLIENT_ID,
  clientSecret: process.env.CLICKUP_CLIENT_SECRET
}

const MondayProvider = {
  id: 'monday',
  name: 'Monday.com',
  type: 'oauth',
  version: '2.0',
  authorization: {
    url: 'https://auth.monday.com/oauth2/authorize',
    params: {
      client_id: process.env.MONDAY_CLIENT_ID,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/monday`,
      response_type: 'code'
    }
  },
  token: {
    url: 'https://auth.monday.com/oauth2/token',
    params: {
      grant_type: 'authorization_code'
    }
  },
  userinfo: {
    url: 'https://api.monday.com/v2',
    params: {},
    async request(context) {
      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'query { me { id name email photo_original } }'
        })
      })
      const result = await response.json()
      return result.data.me
    }
  },
  profile(profile) {
    return {
      id: profile.id.toString(),
      name: profile.name,
      email: profile.email,
      image: profile.photo_original
    }
  },
  clientId: process.env.MONDAY_CLIENT_ID,
  clientSecret: process.env.MONDAY_CLIENT_SECRET
}

const NotionProvider = {
  id: 'notion',
  name: 'Notion',
  type: 'oauth',
  version: '2.0',
  authorization: {
    url: 'https://api.notion.com/v1/oauth/authorize',
    params: {
      response_type: 'code',
      owner: 'user'
    }
  },
  token: 'https://api.notion.com/v1/oauth/token',
  userinfo: {
    url: 'https://api.notion.com/v1/users/me',
    async request({ tokens, provider }) {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Notion-Version': '2022-06-28'
        }
      })
      return await response.json()
    }
  },
  profile(profile) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.person?.email,
      image: profile.avatar_url
    }
  },
  clientId: process.env.NOTION_CLIENT_ID,
  clientSecret: process.env.NOTION_CLIENT_SECRET
}

const handler = NextAuth({
  providers: [
    TrelloProvider as any,
    AsanaProvider as any,
    ClickUpProvider as any,
    MondayProvider as any,
    NotionProvider as any
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log(`[OAuth] Sign in attempt for ${account?.provider}:`, {
        userId: user.id,
        provider: account?.provider,
        accountId: account?.providerAccountId
      })

      if (!account) return false

      try {
        // Store the platform connection in our database
        const connectionData = {
          platform: account.provider,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          token_type: account.token_type || 'Bearer',
          expires_at: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
          scope: account.scope,
          platform_user_id: account.providerAccountId,
          platform_username: user.name || user.email,
          platform_workspace_id: (profile as any)?.workspaceId || null,
          platform_workspace_name: (profile as any)?.workspaceName || null,
          last_used_at: new Date().toISOString()
        }

        // Check if connection already exists
        const { data: existingConnection } = await supabase
          .from('platform_connections')
          .select('id')
          .eq('platform', account.provider)
          .eq('platform_user_id', account.providerAccountId)
          .single()

        if (existingConnection) {
          // Update existing connection
          const { error } = await supabase
            .from('platform_connections')
            .update(connectionData)
            .eq('id', existingConnection.id)

          if (error) {
            console.error('[OAuth] Failed to update platform connection:', error)
            return false
          }
        } else {
          // Insert new connection
          const { error } = await supabase
            .from('platform_connections')
            .insert(connectionData)

          if (error) {
            console.error('[OAuth] Failed to store platform connection:', error)
            return false
          }
        }

        console.log(`[OAuth] Successfully stored ${account.provider} connection`)
        return true

      } catch (error) {
        console.error(`[OAuth] Error during ${account.provider} sign in:`, error)
        return false
      }
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        token.platformUserId = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.provider = token.provider as string
        session.platformUserId = token.platformUserId as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to export manager after successful OAuth
      return `${baseUrl}/export-manager?connected=true`
    }
  },
  pages: {
    error: '/export-manager?error=oauth_error',
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }