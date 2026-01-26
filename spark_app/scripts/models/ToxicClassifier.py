import torch
import torch.nn as nn
from transformers import AutoModel

class ToxicClassifier(nn.Module):
    def __init__(self,model_name="uitnlp/visobert",dropout=0.1):
        super().__init__()
        self.config = AutoModel.from_pretrained(model_name).config
        self.bert = AutoModel.from_pretrained(model_name)
        self.dropout = nn.Dropout(dropout)
        self.fn = nn.Linear(self.config.hidden_size, 5)

    def forward(self, input_ids, attention_mask):
        out = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        pooler_output = out.pooler_output  # CLS
        pooler_output = self.dropout(pooler_output)
        logits = self.fn(pooler_output)
        return logits