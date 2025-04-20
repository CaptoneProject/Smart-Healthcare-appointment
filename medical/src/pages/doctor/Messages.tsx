import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import messagingService from '../../services/messagingService';
import { formatRelativeTime } from '../../utils/dateTime';
import { Send, User } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  user_type: string;
  has_unread: boolean;
  last_message_time?: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  receiver_name: string;
  sender_type: string;
  receiver_type: string;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  // Fetch contacts when component mounts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await messagingService.getContacts();
        setContacts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      const fetchMessages = async () => {
        try {
          const data = await messagingService.getConversation(selectedContact.id);
          setMessages(data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();
      
      // Set up polling to check for new messages every 10 seconds
      const intervalId = setInterval(fetchMessages, 10000);
      
      // Cleanup interval on component unmount or when selected contact changes
      return () => clearInterval(intervalId);
    }
  }, [selectedContact]);

  // Scroll to the bottom of the message list when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContact || !newMessage.trim()) return;
    
    try {
      setSending(true);
      await messagingService.sendMessage(selectedContact.id, newMessage);
      
      // Refresh messages
      const data = await messagingService.getConversation(selectedContact.id);
      setMessages(data);
      
      // Clear the input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Patient Messages" 
        description="Communicate securely with your patients"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Contact List */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <Card className="h-[calc(80vh-6rem)] flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-medium text-white/90">Patients</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 rounded-lg cursor-pointer flex items-center transition-colors ${
                        selectedContact?.id === contact.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-white/90">{contact.name}</span>
                          {contact.has_unread && (
                            <span className="bg-blue-500 text-white text-xs rounded-full h-2 w-2"></span>
                          )}
                        </div>
                        <p className="text-sm text-white/60">Patient</p>
                        {contact.last_message_time && (
                          <p className="text-xs text-white/40 mt-1">
                            {formatRelativeTime(new Date(contact.last_message_time))}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/60">No patients have messaged you yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Message Area */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <Card className="h-[calc(80vh-6rem)] flex flex-col">
            {selectedContact ? (
              <>
                {/* Contact Header */}
                <div className="p-4 border-b border-white/10 flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white/90">{selectedContact.name}</h2>
                    <p className="text-sm text-white/60">Patient</p>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length > 0 ? (
                    <>
                      {messages.map((message) => {
                        const isCurrentUser = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] p-3 rounded-lg ${
                                isCurrentUser
                                  ? 'bg-blue-500/20 text-blue-100'
                                  : 'bg-white/10 text-white/90'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className="text-xs mt-1 opacity-60">
                                {formatRelativeTime(new Date(message.created_at))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-white/60">
                        No messages yet. Start the conversation by sending a message.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="ml-2 p-2 w-10 h-10 flex items-center justify-center"
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <h3 className="text-xl font-medium text-white/90 mb-2">Select a patient</h3>
                <p className="text-white/60 text-center">
                  Choose a patient from the list to start messaging
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;