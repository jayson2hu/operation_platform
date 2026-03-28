from abc import ABC, abstractmethod


class ChannelAdapter(ABC):
    channel_type: str

    @abstractmethod
    def generate(self, source_content: dict, account_context: dict) -> dict:
        raise NotImplementedError

    @abstractmethod
    def validate(self, adaptation: dict, account_context: dict) -> dict:
        raise NotImplementedError

    @abstractmethod
    def build_publish_payload(
        self,
        adaptation: dict,
        media_variants: list[dict],
        account_context: dict,
    ) -> dict:
        raise NotImplementedError

    @abstractmethod
    def publish(self, publish_payload: dict, account_context: dict) -> dict:
        """
        Execute publishing to the channel.

        Args:
            publish_payload: Payload built by build_publish_payload()
            account_context: Account credentials and configuration

        Returns:
            dict with keys:
            - external_post_id: The post ID from the channel
            - live_url: URL to view the published post
            - status: "success" or "failed"
            - error_message: Error details if failed
        """
        raise NotImplementedError
