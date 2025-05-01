import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Avatar, Surface, IconButton, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../navigation/AppNavigator';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ChatScreenRouteProp = RouteProp<AppStackParamList, 'Chat'>;

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface ChatUser {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const { matchId } = route.params;

  // Set up navigation header
  useEffect(() => {
    if (otherUser) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <Avatar.Image 
              size={36} 
              source={{ uri: otherUser.avatar_url || 'https://ui-avatars.com/api/?name=' + otherUser.username }} 
            />
            <Text style={styles.headerText}>{otherUser.username}</Text>
          </View>
        ),
        headerRight: () => (
          <IconButton
            icon="information-outline"
            size={24}
            onPress={() => {
              if (matchDetails?.game_id) {
                navigation.navigate('GameDetails', { gameId: matchDetails.game_id });
              }
            }}
          />
        ),
      });
    }
  }, [otherUser, navigation, matchDetails]);

  // Load match details and messages
  useEffect(() => {
    const loadMatchAndMessages = async () => {
      try {
        setLoading(true);
        
        // Get match details
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select(`
            *,
            matched_user:matched_user_id(id, username, full_name, avatar_url),
            initiator:user_id(id, username, full_name, avatar_url),
            game:game_id(*)
          `)
          .eq('id', matchId)
          .single();
          
        if (matchError) throw matchError;
        
        setMatchDetails(matchData);
        
        // Determine which user is the other user
        const otherUserData = matchData.user_id === user?.id 
          ? matchData.matched_user 
          : matchData.initiator;
          
        setOtherUser(otherUserData);
        
        // Get messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        setMessages(messagesData || []);
        
        // Mark messages as read
        if (messagesData && messagesData.length > 0) {
          const unreadMessages = messagesData.filter(
            msg => !msg.read && msg.sender_id !== user?.id
          );
          
          if (unreadMessages.length > 0) {
            await supabase
              .from('chat_messages')
              .update({ read: true })
              .in('id', unreadMessages.map(msg => msg.id));
          }
        }
      } catch (error) {
        console.error('Error loading match and messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMatchAndMessages();
    
    // Set up real-time subscription
    const messageSubscription = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        
        // Add message to state
        setMessages(current => [...current, newMsg]);
        
        // Mark as read if from other user
        if (newMsg.sender_id !== user?.id) {
          supabase
            .from('chat_messages')
            .update({ read: true })
            .eq('id', newMsg.id)
            .then(() => console.log('Message marked as read'));
        }
      })
      .subscribe();
      
    setSubscription(messageSubscription);
    
    // Cleanup subscription
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [matchId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !matchId) return;
    
    try {
      setSending(true);
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: newMessage.trim(),
          read: false,
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  // Render message item
  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageContainer, isFromMe ? styles.myMessage : styles.theirMessage]}>
        <Surface style={[styles.messageBubble, isFromMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isFromMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isFromMe ? styles.myTimeText : styles.theirTimeText]}>
            {formatTime(item.created_at)}
          </Text>
        </Surface>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="message-text-outline" size={64} color={COLORS.disabled} />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
        />
      )}
      
      <Divider />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
          disabled={sending}
        />
        <IconButton
          icon="send"
          size={24}
          color={COLORS.primary}
          disabled={!newMessage.trim() || sending}
          onPress={sendMessage}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: COLORS.text,
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimeText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: COLORS.background,
  },
  sendButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.disabled,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ChatScreen;
