import { Accordion, Alert, Modal } from '@mantine/core';

interface HelpModalProps {
  opened: boolean;
  onClose: () => void;
}

const HelpModal = ({ opened, onClose }: HelpModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="How to get your Cloudflare credentials"
      size="lg"
      centered
    >
      <Accordion variant="separated">
        <Accordion.Item value="account-id">
          <Accordion.Control>How to get Cloudflare Account ID</Accordion.Control>
          <Accordion.Panel>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Your Account ID is available in multiple places in the Cloudflare dashboard:
              </p>
              <ol className="list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  Log in to the{' '}
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Cloudflare Dashboard
                  </a>
                </li>
                <li>Select any domain or go to the account overview page</li>
                <li>Look for the "Account ID" in the right sidebar under "API" section</li>
                <li>Click the copy button next to the Account ID to copy it</li>
              </ol>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                The Account ID is a string that looks like:{' '}
                <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
                </code>
              </p>
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="api-token">
          <Accordion.Control>How to create Cloudflare API Token</Accordion.Control>
          <Accordion.Panel>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Create a custom API token with the necessary permissions for R2:
              </p>
              <ol className="list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  Go to{' '}
                  <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Cloudflare Dashboard → My Profile → API Tokens
                  </a>
                </li>
                <li>Click "Create Token"</li>
                <li>Select "Custom token" template</li>
                <li>
                  Set the following permissions:
                  <ul className="mt-2 ml-4 list-inside list-disc space-y-1">
                    <li>
                      <strong>Account</strong> - Cloudflare R2:Edit
                    </li>
                    <li>
                      <strong>Zone</strong> - Zone:Read (if you need to access zone-specific
                      features)
                    </li>
                  </ul>
                </li>
                <li>Under "Account Resources", select "Include - [Your Account]"</li>
                <li>Optionally set Client IP Address Filtering for security</li>
                <li>Click "Continue to summary" then "Create Token"</li>
                <li>Copy the token immediately (it won't be shown again)</li>
              </ol>
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="r2-credentials">
          <Accordion.Control>How to generate R2 Access Key and Secret Key</Accordion.Control>
          <Accordion.Panel>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Generate R2-specific credentials for API access:
              </p>
              <ol className="list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  Log in to the{' '}
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Cloudflare Dashboard
                  </a>
                </li>
                <li>
                  Navigate to <strong>R2 Object Storage</strong> in the left sidebar
                </li>
                <li>If you haven't set up R2 yet, you'll need to enable it first</li>
                <li>Click on "Manage R2 API tokens" in the right sidebar</li>
                <li>Click "Create API token"</li>
                <li>Give your token a descriptive name (e.g., "OrangeCloud App")</li>
                <li>
                  Set permissions to <strong>Admin Read & Write</strong> or customize as needed
                </li>
                <li>
                  Optionally, specify which buckets this token can access (leave empty for all)
                </li>
                <li>Set a TTL (Time To Live) or leave it to never expire</li>
                <li>Click "Create API Token"</li>
                <li>
                  Copy both the <strong>Access Key ID</strong> and{' '}
                  <strong>Secret Access Key</strong>
                </li>
              </ol>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                <strong>Important:</strong> Store these credentials securely. The Secret Access Key
                will not be shown again after this step.
              </p>
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="encryption">
          <Accordion.Control>About Encryption & Security</Accordion.Control>
          <Accordion.Panel>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                OrangeCloud uses client-side encryption to protect your credentials:
              </p>
              <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Client-side encryption:</strong> Your credentials are encrypted in your
                  browser before being sent to our servers
                </li>
                <li>
                  <strong>Zero-knowledge:</strong> We cannot access your credentials even if our
                  database is compromised
                </li>
                <li>
                  <strong>Strong encryption:</strong> AES-256-GCM encryption with PBKDF2 key
                  derivation
                </li>
                <li>
                  <strong>Passphrase protection:</strong> Only you know your passphrase - choose a
                  strong one and remember it
                </li>
                <li>
                  <strong>Cross-device sync:</strong> Use the same passphrase on all devices to
                  access your credentials
                </li>
              </ul>
              <Alert color="orange" className="mt-3">
                <p className="text-sm">
                  <strong>Important:</strong> If you forget your passphrase, your encrypted
                  credentials cannot be recovered. Make sure to store it securely.
                </p>
              </Alert>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Modal>
  );
};

export default HelpModal;
