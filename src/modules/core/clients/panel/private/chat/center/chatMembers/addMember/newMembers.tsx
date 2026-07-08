import {useCallback, useEffect, useState} from 'react'
import {Check, UserRoundSearch, X} from 'lucide-react'
import {compose} from "redux";
import withLanguage, {ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {Form, FormLabel} from "@coreModule/components/ui/form.tsx";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import * as React from "react";
import {InputWithIcon} from "@coreModule/components/custom/inputWithIcon.tsx";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {SimpleUsersFormResponseType} from "armonia/src/modules/core/api/company/private/users/simpleUsers.form.response.type.ts";
import {SimpleUsersFormType} from "armonia/src/modules/core/api/company/private/users/simpleUsers.form.type.ts";
import {SimpleUserType} from "armonia/src/modules/core/api/company/private/users/simpleUsers.form.response.type.ts";
import {createChannelFormSchema} from "armonia/src/modules/core/api/user/private/chats/channels/createChannel.form.validator.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import InfiniteList from "@coreModule/components/custom/infiniteList";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";

type MemberRowProps = {
    user: SimpleUserType;
    selectedUserIds: string[];
    existingUserIds: string[];
    onToggleMember: (user: SimpleUserType) => void;
};

function MemberRow({
    user,
    selectedUserIds,
    existingUserIds,
    onToggleMember
}: MemberRowProps) {
    const isSelected = selectedUserIds.includes(user._id);
    const isExisting = existingUserIds.includes(user._id);
    const showCheck = isSelected || isExisting;

    const handleClick = () => {
        if (isExisting) return;
        onToggleMember(user);
    };

    return (
        <div
            onClick={handleClick}
            className={
                isExisting
                    ? 'flex items-center justify-between gap-2 px-2 py-1 rounded opacity-60 cursor-not-allowed'
                    : 'hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2 px-2 py-1 rounded hover:cursor-pointer'
            }
        >
            <div className='flex items-center gap-2'>
                <CustomAvatar user={user} avatarClassName={"size-10"}/>
                <div className='flex flex-col'>
                    <p className='text-sm font-medium'>
                        {user.name} {user.surname}
                    </p>
                </div>
            </div>
            {showCheck && <Check className='h-4 w-4' />}
        </div>
    );
}

type MembersInfiniteListProps = WithAxiosType<SimpleUsersFormResponseType, SimpleUsersFormType> & {
    resolveLanguageKey: ResolveLanguageKey;
    nameSearch: string;
    selectedUserIds: string[];
    existingUserIds: string[];
    onToggleMember: (user: SimpleUserType) => void;
};

function MembersInfiniteList({
    resolveLanguageKey,
    nameSearch,
    onFilterChange,
    data,
    loading,
    error,
    selectedUserIds,
    existingUserIds,
    onToggleMember
}: MembersInfiniteListProps) {
    const {read} = useAccess("users");

    if (!read) {
        return <HiddenElement />;
    }

    return (
        <InfiniteList<SimpleUserType>
            data={data}
            loading={loading}
            error={error}
            onFilterChange={(filter) => onFilterChange({ ...filter, name: nameSearch || "" })}
            limit={50}
            scrollRootClassName="max-h-[200px] min-h-[200px] overflow-y-auto"
            getId={(item) => item._id}
            renderItem={(user) => {
                return (
                    <MemberRow
                        user={user}
                        selectedUserIds={selectedUserIds}
                        existingUserIds={existingUserIds}
                        onToggleMember={onToggleMember}
                    />
                )
            }}
            renderError={({onRetry}) => (
                <SimpleError
                    title={resolveLanguageKey("failTitle")}
                    description={resolveLanguageKey("failTitleTooltip")}
                    onClick={onRetry}
                />
            )}
            renderNoData={() => (
                <div className="p-4 text-center text-muted-foreground text-sm">
                    {resolveLanguageKey("noDataTitle")}
                </div>
            )}
        />
    );
}

const MembersInfiniteListWithAxios = compose(
    withAxios(
        {
            url: "/api/company/users/simple",
            method: "post",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(MembersInfiniteList);



function SelectedMembers({
    resolveLanguageKey,
    selectedUserIds,
    selectedUserDetails,
    onToggleMember
}: {
    resolveLanguageKey: Function;
    selectedUserIds: string[];
    selectedUserDetails: Record<string, SimpleUserType>;
    onToggleMember: (user: SimpleUserType) => void;
}) {
    const selectedUsers = selectedUserIds.map((id) => selectedUserDetails[id]).filter(Boolean);

    return (
        <Collapsible open={selectedUserIds.length > 0}>
            <CollapsibleContent className="collapsible-content ">
                <div className="rounded-lg border px-2 py-3 space-y-1">
                    <div className="max-w-full hide-scrollbar space-y-2">
                        <FormLabel>{resolveLanguageKey("title")}:</FormLabel>
                        <div className='flex px-2 flex-nowrap items-center gap-4 max-w-full overflow-x-scroll space-y-1'>
                            {
                                selectedUsers.map((user) => {
                                    return (
                                        <div className="relative space-y-1" key={user._id}>
                                            <div className="absolute p-0.5 right-0 top-0 hover:cursor-pointer rounded-full bg-muted-foreground text-white hover:bg-foreground" style={{zIndex: 1}} onClick={() => onToggleMember(user)}>
                                                <X size={12}/>
                                            </div>
                                            <CustomAvatar user={user} avatarClassName={"size-14"}/>
                                            <p className="text-xs text-center font-semibold">{user.name}</p>
                                        </div>
                                    )
                                })
                            }
                            <div style={{width: "150px", minWidth: "150px"}}></div>
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

type NewMembersProps = WithLanguageType & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    specificUserId: string;
    ChildComponent?: React.FC<{groupName: string; fireUpdate: number; handleClose: Function; channel: Channel; userIds: string[]}> & any;
    channel: Channel;
    users: string[];
};

function NewMembers({
    onOpenChange,
    resolveLanguageKey,
    languageCode,
    ChildComponent,
    channel,
    users
}: NewMembersProps) {

    const [fireUpdate, setFireUpdate] = useState<number>(0);
    const [nameSearch, setNameSearch] = useState<string>("");
    const [nameInput, setNameInput] = useState<string>("");
    const [selectedUserDetails, setSelectedUserDetails] = useState<Record<string, SimpleUserType>>({});

    const formSchema = createChannelFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "Group",
            userIds: [] as string[],
        }
    });
    const name = form.watch("name");
    const selectedUserIds = form.watch("userIds") ?? [];

    const onToggleMember = useCallback((user: SimpleUserType) => {
        if (users.includes(user._id)) return;
        const userIds = form.getValues("userIds") ?? [];
        if (userIds.includes(user._id)) {
            form.setValue("userIds", userIds.filter((id) => id !== user._id));
            setSelectedUserDetails((prev) => {
                const next = { ...prev };
                delete next[user._id];
                return next;
            });
        } else {
            form.setValue("userIds", [...userIds, user._id]);
            setSelectedUserDetails((prev) => ({ ...prev, [user._id]: user }));
        }
    }, [form, users]);

    const addMembers = () => {
        setFireUpdate(Date.now());
    };

    useEffect(() => {
        if (nameInput === null) return;
        const timeout = setTimeout(() => setNameSearch(nameInput), 200);
        return () => clearTimeout(timeout);
    }, [nameInput]);

    return (
        <div className='max-w-full overflow-hidden'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(addMembers)} className="flex flex-col">
                    <div className="border rounded-lg overflow-hidden space-y-2">
                        <InputWithIcon
                            icon={<UserRoundSearch size={16} className="text-muted-foreground" />}
                            type="text"
                            className="rounded-es-none rounded-ee-none border-t-0 border-r-0 border-l-0 shadow-xs"
                            placeholder={resolveLanguageKey("searchPeople")}
                            value={nameInput}
                            onInputCapture={(e) => setNameInput(e.currentTarget.value)}
                        />
                        <MembersInfiniteListWithAxios
                            key={nameSearch}
                            // @ts-expect-error
                            nameSearch={nameSearch}
                            resolveLanguageKey={resolveLanguageKey}
                            selectedUserIds={selectedUserIds}
                            existingUserIds={users}
                            onToggleMember={onToggleMember}
                        />
                    </div>

                    <SelectedMembers
                        resolveLanguageKey={resolveLanguageKey}
                        selectedUserIds={selectedUserIds}
                        selectedUserDetails={selectedUserDetails}
                        onToggleMember={onToggleMember}
                    />

                    <ChildComponent
                        groupName={name}
                        fireUpdate={fireUpdate}
                        handleClose={(newOpen: boolean) => onOpenChange(newOpen)}
                        channel={channel}
                        userIds={selectedUserIds}
                    />
                </form>
            </Form>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatMembers/addMember/newMembers.tsx"),
    withDebug(true, true)
)(NewMembers);
