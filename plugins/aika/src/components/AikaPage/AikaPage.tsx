import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Content,
  Header,
  Page,
  Progress,
} from '@backstage/core-components';

import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';

import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from '@material-ui/core';

import { AikaApi } from '../../api/AikaApi';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export const AikaPage = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);

  const [accessState, setAccessState] = useState<
    'loading' | 'allowed' | 'denied' | 'error'
  >('loading');

  useEffect(() => {
    let active = true;

    identityApi
      .getBackstageIdentity()
      .then(identity => {
        if (active) {
          setAccessState(
            identity.userEntityRef === 'user:default/backstage-guest'
              ? 'denied'
              : 'allowed',
          );
        }
      })
      .catch(() => {
        if (active) {
          setAccessState('error');
        }
      });

    return () => {
      active = false;
    };
  }, [identityApi]);

  const api = useMemo(
    () =>
      new AikaApi(
        discoveryApi,
        fetchApi,
      ),
    [discoveryApi, fetchApi],
  );

  const [question, setQuestion] =
    useState('');

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string>();

  if (accessState === 'loading') {
    return (
      <Page themeId="tool">
        <Header title="AIKA" subtitle="AI Knowledge Assistant" />
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  if (accessState === 'denied' || accessState === 'error') {
    return (
      <Page themeId="tool">
        <Header title="AIKA" subtitle="AI Knowledge Assistant" />
        <Content>
          <Typography color={accessState === 'error' ? 'error' : 'textSecondary'}>
            {accessState === 'denied'
              ? 'AIKA is available only to signed-in users.'
              : 'Unable to verify your sign-in. Please reload and try again.'}
          </Typography>
        </Content>
      </Page>
    );
  }

  const askAika = async () => {
    const trimmed =
      question.trim();

    if (!trimmed) {
      return;
    }

    setMessages(previous => [
      ...previous,
      {
        role: 'user',
        content: trimmed,
      },
    ]);

    setQuestion('');
    setLoading(true);
    setError(undefined);

    try {
      const response =
        await api.ask(trimmed);

      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          content: response.answer,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page themeId="tool">
      <Header
        title="AIKA"
        subtitle="AI Knowledge Assistant"
      />

      <Content>
        <Box
          maxWidth={900}
          margin="auto"
        >
          <Card>
            <CardContent>

              <Typography
                variant="h5"
                gutterBottom
              >
                Ask your engineering platform
              </Typography>

              <Typography
                variant="body2"
                color="textSecondary"
              >
                Ask about services,
                ownership, lifecycle,
                APIs and platform
                information.
              </Typography>

            </CardContent>
          </Card>

          <Box mt={3}>

            {messages.map(
              (message, index) => (
                <Box
                  key={index}
                  mb={2}
                >
                  <Card>
                    <CardContent>

                      <Typography
                        variant="caption"
                        color="textSecondary"
                      >
                        {message.role ===
                        'user'
                          ? 'You'
                          : 'AIKA'}
                      </Typography>

                      <Typography>
                        {message.content}
                      </Typography>

                    </CardContent>
                  </Card>
                </Box>
              ),
            )}

          </Box>

          {loading && (
            <Box my={2}>
              <Progress />
            </Box>
          )}

          {error && (
            <Box my={2}>
              <Typography color="error">
                {error}
              </Typography>
            </Box>
          )}

          <Box mt={3}>

            <TextField
              fullWidth
              variant="outlined"
              label="Ask AIKA"
              placeholder="Who owns payment-service?"
              value={question}
              multiline
              minRows={3}
              onChange={event =>
                setQuestion(
                  event.target.value,
                )
              }
              onKeyDown={event => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey
                ) {
                  event.preventDefault();

                  askAika();
                }
              }}
            />

            <Box mt={2}>

              <Button
                variant="contained"
                color="primary"
                disabled={
                  loading ||
                  !question.trim()
                }
                onClick={askAika}
              >
                Ask AIKA
              </Button>

            </Box>

          </Box>
        </Box>
      </Content>
    </Page>
  );
};