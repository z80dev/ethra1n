import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';
import { SignCommand, SignResponse } from './hooks/useSign';
import { GetKeyInfoCommand, GetKeyInfoResponse } from './hooks/useGetKeyInfo';

export const sign = async (params: SignCommand): Promise<SignResponse> => {
    return execHaloCmdWeb(params) as Promise<SignResponse>;
}

export const getKeyInfo = async (keyNo: number): Promise<GetKeyInfoResponse> => {
    const command: GetKeyInfoCommand = {
        name: 'get_key_info',
        keyNo
    };
    return execHaloCmdWeb(command) as Promise<GetKeyInfoResponse>;
}
