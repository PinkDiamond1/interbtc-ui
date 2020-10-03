import React from "react";
import { FormGroup, ListGroup, ListGroupItem } from "react-bootstrap";
import { IssueWizardProps } from "./issue-wizard";
import { ChangeEvent } from "react";
import { useEffect } from "react";
import { Keyring } from "@polkadot/api";
import { useSelector } from "react-redux";
import { StoreType } from "../../types/util.types";

interface BTCPaymentProps {
    step: number;
    amountBTC: string,
    feeBTC: string,
    vaultBTCAddress: string,
    vaultId: string,
    currentIssueRequestHash: string,
    handleChange: () => void,
}

export default function BTCPayment(props: IssueWizardProps | BTCPaymentProps) {
    const polkaBTC = useSelector((state: StoreType) => state.api);

    useEffect(() => {
        if (props.step === 3) {
            const fetchData = async () => {

                const keyring = new Keyring({ type: "sr25519" });
                const alice = keyring.addFromUri("//Alice");
                polkaBTC.issue.setAccount(alice);

                const vaultAccountId = polkaBTC.api.createType("AccountId", props.vaultId) as any;
                const polkaBTCAmount = polkaBTC.api.createType("Balance", props.amountBTC) as any;
                try {
                    const requestResult = await polkaBTC.issue.request(polkaBTCAmount, vaultAccountId);
                    props.handleChange(
                        {
                            target:
                                {
                                    name: "currentIssueRequestHash",
                                    value: requestResult.hash.toString(),
                                } as EventTarget & HTMLInputElement
                        } as ChangeEvent<HTMLInputElement>
                    );
                } catch (e) {
                    console.log(`Error requesting polkaBTC: \n${e}`);
                }
            };
            fetchData();
        }
    });

    const amountBTCwithFee = (Number.parseFloat(props.amountBTC) + Number.parseFloat(props.feeBTC)).toString();
    if (props.step !== 3) {
        return null;
    }

    return (
        <FormGroup>
            <h5>Confirmation and Payment</h5>
            <p>You have requested to mint {props.amountBTC} PolkaBTC, incurring a fee of {props.feeBTC} BTC.</p>
            <p>Please make the following Bitcoin payment.</p>
            <h5>Bitcoin Payment Details</h5>
            <p>Create a Bitcoin transaction with two outputs.</p>
            <FormGroup>
                <ListGroup>
                    <ListGroupItem>Output 1</ListGroupItem>
                    <ListGroupItem>OP_RETURN: <strong> {props.currentIssueRequestHash} </strong></ListGroupItem>
                    <ListGroupItem>Amount: <strong>0 BTC</strong></ListGroupItem>
                </ListGroup>
                <ListGroup>
                    <ListGroupItem>Output 2</ListGroupItem>
                    <ListGroupItem>Recipient: <strong>{props.vaultBTCAddress}</strong></ListGroupItem>
                    <ListGroupItem>Amount: <strong>{amountBTCwithFee} BTC</strong></ListGroupItem>
                </ListGroup>
            </FormGroup>
        </FormGroup>
    );
}